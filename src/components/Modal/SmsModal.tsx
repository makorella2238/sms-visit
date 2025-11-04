import React, {useState, useMemo, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import './SmsModal.css';

export function SmsModal({
                             type = 'new',
                             initialNumbers = [],
                             onClose,
                             editData = null,
                             onSuccess
                         }) {

    const [jwtToken, setJwtToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiY29udGFjdF9pZCI6MTIzLCJleHAiOjE3NjIzNTAyODQsImlhdCI6MTc2MjI2Mzg4NH0.HPC7JgKq2m2KINvN7GTFhCHYdMQ7jgjTpwvAnBdxldQ');

    const [availableNumbers] = useState([
        '79991231212',
        '79995556677',
        '79161230000',
        ...initialNumbers,
    ]);

    // Моковые данные для аккаунтов
    const [dynamicAccounts, setDynamicAccounts] = useState([
        { id: '1', name: 'Основной аккаунт' },
        { id: '2', name: 'Резервный аккаунт' },
        { id: '3', name: 'Аккаунт для тестов' },
        { id: '4', name: 'Бизнес аккаунт' },
        { id: '5', name: 'Личный аккаунт' }
    ]);
    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setError, // ← добавили
        setValue,
        trigger,
        reset // ← добавляем
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            newClientMonths: 1,
            message: '',
            sendMode: 'smart',
            selectedAccount:  '',
            dailyLimit: '',
            repeatMinutes: 60,
            selectedTags: []
        }
    });

    const watchMessage = watch('message');
    const watchSendMode = watch('sendMode');

    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedNumberValue, setSelectedNumberValue] = useState('');
    const [loadingAccounts, setLoadingAccounts] = useState(false);


    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // constants
    const MAX_CHARS = 134;
    const COST = 40;
    const SMS_PER = MAX_CHARS;

    // derived values
    const charCount = watchMessage?.length || 0;
    const smsCount = Math.max(1, Math.ceil(charCount / SMS_PER || 0));
    const cost = smsCount * COST;

    // add selected number to tags
    function handleSelectNumber(e) {
        const v = e.target.value;
        if (!v) return;
        if (!selectedTags.includes(v)) {
            const updated = [...selectedTags, v];
            setSelectedTags(updated);
            setValue("selectedTags", updated); // ✅ обновляем форму
            trigger("selectedTags"); // ✅ мгновенная валидация
        }
        setSelectedNumberValue('');
        e.target.value = '';
    }

    function handleRemoveTag(number) {
        const updated = selectedTags.filter(n => n !== number);
        setSelectedTags(updated);
        setValue("selectedTags", updated); // ✅ обновляем форму
        trigger("selectedTags");
    }


    const monthsOptions = useMemo(
        () => [1, 2, 3, 4, 5, 6].map(n => ({
            value: String(n),
            label: `${n} ${n === 1 ? 'месяц' : n < 5 ? 'месяца' : 'месяцев'}`
        })),
        []
    );

    async function fetchAccounts(contactId) {
        setLoadingAccounts(true);
        try {
            const response = await fetch("https://lk.b2b-help.ru/api/sms-card/get_accounts.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contact_id: contactId,
                    api_key: "token" // ← замени на реальный токен
                })
            });

            if (!response.ok) {
                throw new Error("Ошибка при получении аккаунтов");
            }

            const data = await response.json();
            console.log('data', data)
            // предполагаем, что API возвращает массив {id, name}
            setDynamicAccounts(data.accounts || []);
        } catch (err) {
            console.error(err);
            alert("Не удалось загрузить аккаунты");
        } finally {
            setLoadingAccounts(false);
        }
    }


    useEffect(() => {
        if (editData) {
            const initialTag = editData.avito_phone
                ? editData.avito_phone.replace(/\D/g, '')
                : '';

            const mode =
                editData.meth_sms && editData.meth_max ? 'smart' :
                    editData.meth_sms && !editData.meth_max ? 'sms' :
                        !editData.meth_sms && editData.meth_max ? 'max' :
                            'smart';

            reset({
                message: editData.sms_text || '',
                selectedTags: initialTag ? [initialTag] : [],
                newClientMonths: Number(editData.new_buyer) || 1,
                repeatMinutes: Number(editData.not_send) || 60,
                sendMode: mode,
                selectedAccount: editData.max_account ||  '',
                dailyLimit: editData.limit_sum != null ? String(editData.limit_sum) : '',
            });

            setSelectedTags(initialTag ? [initialTag] : []);
        } else {
            reset({
                message: '',
                selectedTags: [],
                newClientMonths: 1,
                repeatMinutes: 60,
                sendMode: 'smart',
                selectedAccount: '',
                dailyLimit: ''
            });

            setSelectedTags([]);
        }

        setSelectedNumberValue('');
    }, [editData]);




    const onSubmit = async (data) => {
        if (!jwtToken) {
            alert("Нет JWT токена! Сначала авторизуйтесь.");
            return;
        }

        if (selectedTags.length === 0) {
            setError("selectedTags", { type: "manual", message: "Выберите хотя бы один номер" });
            return;
        }

        const sms_type = type === "new" ? 1 : 2;

        const new_buyer = sms_type === 1 ? Number(data.newClientMonths || 1) : null;
        const not_send  = sms_type === 2 ? Number(data.repeatMinutes || 60) : null;

        let meth_sms = false;
        let meth_max = false;
        if (data.sendMode === "smart") {
            meth_sms = true;
            meth_max = true;
        } else if (data.sendMode === "sms") {
            meth_sms = true;
            meth_max = false;
        } else if (data.sendMode === "max") {
            meth_sms = false;
            meth_max = true;
        }

        const max_account = (meth_sms && !meth_max) ? null : String(data.selectedAccount);
        const parsedLimit = data.dailyLimit ? Number(data.dailyLimit) : null;

        const body = {
            contact_id: editData?.contact_id || 16511,
            fio: "Тестовый Пользователь",
            name_id: "test_user",
            sms_type,
            sms_text: data.message,
            avito_phone: selectedTags[0],
            is_active: true,
            new_buyer,
            not_send,
            meth_sms,
            meth_max,
            max_account,
            limit_sum: parsedLimit,
            limit_ost: parsedLimit
        };

        try {
            let response;
            if (editData) {
                const updateUrl = new URL("https://smscard.b2b-help.ru/api/sms-cards/update");
                updateUrl.searchParams.append("contact_id", body.contact_id);
                updateUrl.searchParams.append("avito_phone", body.avito_phone);
                updateUrl.searchParams.append("sms_type", body.sms_type);

                response = await fetch(updateUrl.toString(), {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify(body)
                });
            } else {
                response = await fetch("https://smscard.b2b-help.ru/api/sms-cards/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify(body)
                });
            }

            if (!response.ok) {
                const txt = await response.text();
                console.error("Ошибка:", txt);
                alert(editData ? "Ошибка при сохранении записи" : "Ошибка при добавлении записи");
                return;
            }

            const result = await response.json();
            console.log("Успешно:", result);

            // ✅ Обновляем данные после успешного добавления/редактирования
            if (typeof onSuccess === "function") {
                await onSuccess(); // родительская функция должна делать GET-запрос всех карточек
            }

            onClose(); // закрываем модалку

        } catch (error) {
            console.error("Ошибка сети:", error);
            alert("Ошибка сети");
        }
    };



    return (
        <div className="sms-modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
            <div className="sms-modal-container" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* header */}
                    <div className="sms-modal-header">
                        <div className="sms-modal-back-btn" onClick={onClose} title="Закрыть">
                            <img src="/arr_buttons.svg" alt=""/>
                        </div>
                        <div className="sms-modal-title-block">
                            <div className="sms-modal-title">SMS визитка</div>
                            <div className="sms-modal-subtitle">
                                {type === 'new'
                                    ? 'Добавление СМС-визитки новым клиентам'
                                    : 'Добавление СМС-извинения после пропущенного звонка'}
                            </div>
                        </div>
                    </div>

                    <div className="sms-modal-divider"/>

                    {/* Выберите номер */}
                    <div className="sms-section">
                        <div className="sms-section-title">Выберите номер</div>
                        <div className="sms-section-sub">
                            {type === 'new'
                                ? 'Мы отправим SMS визитку после успешного звонка на этот номер'
                                : 'В случае пропущенного звонка на этот номер звонящему будет отправлено СМС-извинение. Извинение будет отправлено в рабочее время, настроенное для номера'}
                        </div>

                        <select
                            className="sms-select"
                            value={selectedNumberValue}
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (!selected) return;

                                // добавляем выбранный номер в теги, если его там ещё нет
                                if (!selectedTags.includes(selected)) {
                                    const updated = [...selectedTags, selected];
                                    setSelectedTags(updated);
                                    setValue("selectedTags", updated); // обновляем форму
                                    trigger("selectedTags"); // мгновенная валидация
                                }

                                // обновляем стейт выбранного номера
                                setSelectedNumberValue(selected);

                                // очищаем select
                                setSelectedNumberValue('');
                                e.target.value = '';
                            }}
                            // onClick={async () => {
                            //     // делаем запрос на сервер при клике на select
                            //     await fetchAccounts(editData?.contact_id || 0);
                            // }}
                        >
                            <option value="">Выберите номер</option>
                            {availableNumbers.map((n) => (
                                <option key={n} value={n}>
                                    {formatPhone(n)}
                                </option>
                            ))}
                        </select>


                        <div className="sms-tags-row">
                            {selectedTags.map((n) => (
                                <div
                                    key={n}
                                    className="sms-tag"
                                    onClick={() => handleRemoveTag(n)}
                                    title="Клик — убрать номер"
                                >
                                    {formatPhone(n)}
                                </div>
                            ))}
                        </div>

                        <input
                            type="hidden"
                            {...register("selectedTags", {
                                validate: value => value.length > 0 || "Выберите хотя бы один номер"
                            })}
                        />

                        {errors.selectedTags && (
                            <div className="sms-error-text">{errors.selectedTags.message}</div>
                        )}
                    </div>


                    {/* блок с серовато-голубым фоном */}
                    <div className="sms-card">
                        <div className="sms-card-top">
                            <div className="sms-card-title">Укажите текст SMS визитки</div>
                            <div className="sms-card-help">{/* вставишь свой img */}</div>
                        </div>

                        <div className="sms-card-sub">Напишите сообщение новому клиенту</div>

                        <textarea
                            className={`sms-textarea ${errors.message ? 'sms-input-error' : ''}`}
                            placeholder="Текст..."
                            rows={4}
                            maxLength={1000}
                            {...register('message', {
                                required: 'Текст сообщения обязателен',
                                minLength: {
                                    value: 5,
                                    message: 'Минимальная длина сообщения - 5 символов'
                                },
                                maxLength: {
                                    value: 1000,
                                    message: 'Максимальная длина сообщения - 1000 символов'
                                }
                            })}
                        />
                        {errors.message && (
                            <div className="sms-error-text">{errors.message.message}</div>
                        )}

                        <div className="sms-stats">
                            <div>
                                Символов: <span className="sms-accent">{charCount}</span> из <span
                                className="sms-accent">{MAX_CHARS}</span>
                            </div>
                            <div>
                                SMS: <span className="sms-accent">{smsCount}</span>
                            </div>
                            <div>
                                Стоимость: <span className="sms-accent">{cost}</span> руб
                            </div>
                        </div>
                    </div>

                    {type === 'apology' && (
                        <div className="sms-section">
                            <div className="sms-section-title">Повторная отправка</div>
                            <div className="sms-repeat-row">
                                <div className="sms-repeat-text">
                                    Не отправлять визитку повторно на тот же номер в течение
                                </div>
                                <div className="sms-repeat-inputs">
                                    <div className="number-wrapper">
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            step={1}
                                            className={`sms-number-input ${errors.repeatMinutes ? 'sms-input-error' : ''}`}
                                            {...register('repeatMinutes', {
                                                required: 'Укажите интервал в минутах',
                                                min: { value: 1, message: 'Минимальное значение - 1 минута' },
                                                max: { value: 60, message: 'Максимальное значение - 60 минут' }
                                            })}
                                        />
                                        <div className="custom-arrows">
                                            <button
                                                type="button"
                                                className="arrow-up"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const current = Number(watch('repeatMinutes')) || 1;
                                                    if (current < 60) setValue('repeatMinutes', current + 1, { shouldValidate: true });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="arrow-down"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const current = Number(watch('repeatMinutes')) || 1;
                                                    if (current > 1) setValue('repeatMinutes', current - 1, { shouldValidate: true });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="sms-min-text">минут</div>
                                </div>
                            </div>
                            {errors.repeatMinutes && (
                                <div className="sms-error-text">{errors.repeatMinutes.message}</div>
                            )}
                        </div>
                    )}


                    {/* если type === 'new' — блок решите кого считать новым клиентом */}
                    {type === 'new' && (
                        <div className="sms-section">
                            <div className="sms-section-title">Решите кого мы будем считать новым клиентом</div>
                            <div className="sms-section-sub">
                                Считать клиента «новым»,<br/> если по его номеру не было звонков:
                            </div>

                            <select
                                className="sms-select"
                                {...register('newClientMonths', {
                                    required: 'Выберите период'
                                })}
                            >
                                {[1, 2, 3, 4, 5, 6].map(m => (
                                    <option key={m} value={m}>
                                        {m} месяц{m > 1 ? 'а' : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.newClientMonths && (
                                <div className="sms-error-text">{errors.newClientMonths.message}</div>
                            )}
                        </div>
                    )}

                    {/* Блок куда отправить */}
                    <div className="sms-section">
                        <div className="sms-block">
                            <div className="sms-section-title">Куда отправить</div>

                            <div className="sms-where-row">
                                <label className="sms-where-item">
                                    <input
                                        type="radio"
                                        value="smart"
                                        {...register('sendMode', {
                                            required: 'Выберите способ отправки'
                                        })}
                                        className="sms-round-radio"
                                    />
                                    <span className="sms-where-text">Smart</span>
                                    <img src="/addClietquestion.svg" alt="" className="sms-help-icon"/>
                                </label>

                                <label className="sms-where-item">
                                    <input
                                        type="radio"
                                        value="sms"
                                        {...register('sendMode')}
                                        className="sms-round-radio"
                                    />
                                    <span className="sms-where-text">Только в SMS</span>
                                </label>

                                <label className="sms-where-item">
                                    <input
                                        type="radio"
                                        value="max"
                                        {...register('sendMode')}
                                        className="sms-round-radio"
                                    />
                                    <span className="sms-where-text">Только в max</span>
                                </label>
                            </div>

                            {errors.sendMode && (
                                <div className="sms-error-text">{errors.sendMode.message}</div>
                            )}

                            {/* ✅ Показываем аккаунт только НЕ при "sms" */}
                            {watchSendMode !== 'sms' && (
                                <div className="sms-section account-row">
                                    <div className="sms-section-title-inline">С какого аккаунта отправлять</div>
                                    <select
                                        className="sms-account-select"
                                        {...register('selectedAccount', {
                                            required: 'Выберите аккаунт'
                                        })}
                                        // onFocus={() => fetchAccounts(editData?.contact_id || 0)} // при фокусе делаем запрос
                                    >
                                        {dynamicAccounts?.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {errors.selectedAccount && (
                                watchSendMode !== 'sms' && (
                                    <div className="sms-error-text">{errors.selectedAccount.message}</div>
                                )
                            )}
                        </div>
                    </div>

                    {/* ✅ Показываем "Суточный лимит" только НЕ при "max" */}
                    {watchSendMode !== 'max' && (
                        <div className="sms-section">
                            <div className="sms-section-title">Суточный лимит на SMS</div>
                            <div className="sms-section-sub">
                                Сумма, которая может быть потрачена на эту визитку из кошелька платформы...
                            </div>

                            <input
                                className={`sms-full-input ${errors.dailyLimit ? 'sms-input-error' : ''}`}
                                placeholder="сумма в ₽"
                                type="number"
                                min="0"
                                step="0.01"
                                {...register('dailyLimit', {
                                    required: 'Укажите суточный лимит',
                                    min: { value: 0, message: 'Лимит не может быть отрицательным' },
                                    pattern: { value: /^\d*\.?\d*$/, message: 'Введите корректную сумму' }
                                })}
                            />
                            {errors.dailyLimit && (
                                <div className="sms-error-text">{errors.dailyLimit.message}</div>
                            )}
                        </div>
                    )}


                    {/* кнопка добавить */}
                    <div className="sms-footer">
                        <button
                            type="submit"
                            className="sms-add-button"
                        >
                            {isSubmitting
                                ? (editData ? 'Сохранение...' : 'Добавление...')
                                : (editData ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
        return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    }
    return raw;
}