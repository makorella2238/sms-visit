import React, {useState, useMemo, useEffect, useRef} from 'react';
import {useForm} from 'react-hook-form';
import './SmsModal.css';
import Select from "react-select";
import {defaultSelectStyles} from "../../ui/config/selectStyles.ts";
import {getTokenFromCookies} from "../../api/cookieToken.ts";
import type {AccountPhonesGroup, SmsModalProps, FormValues, ImageFile, SmsMaxMedia} from "../../types/types.ts";
import {CostTooltip} from "../../ui/CostTooltip/CostTooltip.tsx";
import {ImageUpload} from "../../ui/ImageUpload/ImageUpload.tsx";
import {useAccountsPhones, useMaxAccounts} from "../../api/queries/smsModal/smsModal.ts";
import {RepeatInterval} from "../../ui/RepeatInterval/RepeatInterval.tsx";

interface MaxAccount {
    id: number;
    name: string;
}

interface UploadMediaResponse {
    success: boolean;
    media: SmsMaxMedia;
}

const DOUBLE_CHARS = new Set(['{','}','[',']','^','~','\\','|','€']);

export function SmsModal({
                             type = 'new',
                             onClose,
                             modalType,
                             editData = null,
                             onSuccess
                         }: SmsModalProps) {
    const [showTooltipSMS, setShowTooltipSMS] = useState(false);
    const [showTooltipRadio, setShowTooltipRadio] = useState(false);
    const [showTooltipMax, setShowTooltipMax] = useState(false);
    const [numbersPopupOpen, setNumbersPopupOpen] = useState<boolean>(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [accountsPhones, setAccountsPhones] = useState<AccountPhonesGroup[]>([]);

    const [images, setImages] = useState<ImageFile[]>(editData?.sms_max?.images?.map(img => ({
        id: Math.random().toString(36).substr(2, 9),
        preview: img.url,
        name: img.filename,
        url: img.url,
        filename: img.filename,
        mimetype: img.mimetype,
        size: img.size
    })) || []);

    const options = [1, 2, 3, 4, 5, 6].map(m => ({
        value: m,
        label: `${m} месяц${m > 1 ? 'а' : ''}`
    }));

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        watch,
        setError,
        setValue,
        clearErrors,
        reset
    } = useForm<FormValues>({
        mode: 'onChange',
        defaultValues: {
            newClientMonths: 1,
            message: '',
            maxMessage: '',
            sendMode: 'smart',
            selectedAccount: '',
            dailyLimit: '',
            repeatMinutes: 60,
            selectedTags: [],
            wait_durat:60
        }
    });

    const watchMessage = watch('message');
    const watchMaxMessage = watch('maxMessage');
    const watchSendMode = watch('sendMode');

    // Используем React Query для аккаунтов Max
    const {
        data: maxAccountsData,
        isLoading: loadingMaxSelect,
        refetch: fetchMaxAccounts
    } = useMaxAccounts();

    const smsType = modalType === 'new' ? 1 : 2;

    const {
        data: accountsData,
        isLoading: loadingAccounts,
        refetch: fetchAccounts
    } = useAccountsPhones(smsType, false);

    // Преобразуем данные в формат для Select
    const maxAccounts = useMemo(() => {
        if (!maxAccountsData) return [{value: "", label: "Не выбран"}];

        const options = maxAccountsData.map((account: MaxAccount) => ({
            value: account.id.toString(),
            label: account.name
        }));

        return [{value: "", label: "Не выбран"}, ...options];
    }, [maxAccountsData]);

    useEffect(() => {
        if (accountsData) {
            const list: Array<{
                already_exists: boolean;
                sellerPhone: string;
                account_name: string
            }> = accountsData;

            // Правильная группировка по аккаунтам
            const transformed = list.reduce((acc: AccountPhonesGroup[], item) => {
                const phone = item.sellerPhone.replace(/\D/g, '');
                const name = item.account_name || 'Без имени';

                let existingGroup = acc.find(a => a.name === name);

                if (!existingGroup) {
                    existingGroup = {
                        id: name,
                        name,
                        numbers: [],
                        open: false,
                        addPhoneMode: false
                    };
                    acc.push(existingGroup);
                }

                // Добавляем номер, если его еще нет
                if (!existingGroup.numbers.some(n => n.phone === phone)) {
                    existingGroup.numbers.push({
                        phone,
                        already_exists: item.already_exists
                    });
                }

                return acc;
            }, []);

            setAccountsPhones(transformed);
        }
    }, [accountsData]);

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setNumbersPopupOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatPhoneDisplay = (digits: string) => {
        if (!digits) return '';
        const cleaned = digits.replace(/\D/g, '');
        if (cleaned.length !== 11) return digits;
        return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    };

    useEffect(() => {
        if (editData?.max_account) {
            setValue('selectedAccount', String(editData.max_account));
        } else {
            setValue('selectedAccount', '');
        }
    }, [editData, setValue]);

    const allUniqueNumbers = useMemo(() =>
            [...new Set(
                accountsPhones.flatMap(a =>
                    a.numbers.map(n => n.phone)
                )
            )],
        [accountsPhones]
    );


    const handleAllNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTags(allUniqueNumbers);
            setValue("selectedTags", allUniqueNumbers);
        } else {
            setSelectedTags([]);
            setValue("selectedTags", []);
        }
    };

    const isAllNumbersSelected = selectedTags.length > 0 &&
        selectedTags.length === allUniqueNumbers.length;

    // Функция для открытия попапа номеров
    const handleNumbersPopupOpen = () => {
        setNumbersPopupOpen(prev => !prev);
        if (!numbersPopupOpen) {
            fetchAccounts(); // Запускаем запрос через React Query
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSelectNumber = (value: string) => {
        if (type === 'edit') {
            setSelectedTags([value]);
            setValue("selectedTags", [value]);
            clearErrors('selectedTags');
            return;
        }

        let updated: string[];

        if (selectedTags.includes(value)) {
            // 🔥 снимаем галочку
            updated = selectedTags.filter(v => v !== value);
        } else {
            // 🔥 ставим галочку
            updated = [...selectedTags, value];
        }

        setSelectedTags(updated);
        setValue("selectedTags", updated);
        clearErrors('selectedTags');
    };

    const handleRemoveTag = (number: string) => {
        console.log(type, 'type')
        if (type === 'edit') return; // 🚫 запрещаем удаление

        const updated = selectedTags.filter(n => n !== number);
        setSelectedTags(updated);
        setValue("selectedTags", updated);
        clearErrors('selectedTags');
    };

    const detectCharacterSet = (text: string): 'cyrillic' | 'latin' => {
        // если есть хотя бы 1 кириллический символ — это кириллица
        return /[а-яА-ЯёЁ]/.test(text) ? 'cyrillic' : 'latin';
    };

    const calculateSmsStats = (text: string) => {
        if (!text) {
            return {
                charCount: 0,
                smsCount: 1,
                maxChars: 160,
                characterSet: 'latin',
                isOverLimit: false
            };
        }

        const characterSet = detectCharacterSet(text);

        const maxCharsPerSms = characterSet === 'cyrillic' ? 70 : 160;
        const maxSms = characterSet === 'cyrillic' ? 14 : 6;
        const maxTotalChars = maxCharsPerSms * maxSms;

        // считаем символы с учётом спецсимволов
        let charCount = 0;
        for (const ch of text) {
            charCount += DOUBLE_CHARS.has(ch) ? 2 : 1;
        }

        const smsCount = Math.ceil(charCount / maxCharsPerSms) || 1;
        const isOverLimit = smsCount > maxSms;

        return {
            charCount,
            smsCount,
            maxChars: maxCharsPerSms,
            characterSet,
            isOverLimit,
            maxTotalChars
        };
    };

    const smsStats = useMemo(() => calculateSmsStats(watchMessage), [watchMessage]);

    const [selectedAccountValue, setSelectedAccountValue] = useState<{ value: string; label: string }>({
        value: '',
        label: 'Не выбран'
    });

    useEffect(() => {
        if (!editData) {
            reset({
                message: '',
                maxMessage: '',
                selectedTags: [],
                newClientMonths: 1,
                repeatMinutes: 60,
                sendMode: 'smart',
                selectedAccount: '',
                dailyLimit: '',
                wait_durat: 60
            });
            setSelectedTags([]);
            setSelectedAccountValue({value: '', label: 'Не выбран'});
            return;
        }

        const initialTag = getEditPhone() || '';

        const mode: 'smart' | 'sms' | 'max' =
            editData.meth_sms && editData.meth_max ? 'smart' :
                editData.meth_sms && !editData.meth_max ? 'sms' :
                    !editData.meth_sms && editData.meth_max ? 'max' : 'smart';

        // Обработка max_account
        let accountValue: { value: string; label: string };
        if (typeof editData.max_account === 'string') {
            accountValue = {value: editData.max_account, label: editData.max_account};
        } else if (Array.isArray(editData.max_account) && editData.max_account.length > 0) {
            accountValue = {
                value: String(editData.max_account[0].id),
                label: editData.max_account[0].name
            };
        } else {
            accountValue = {value: '', label: 'Не выбран'};
        }

        // Сбрасываем форму
        reset({
            message: editData.sms_text || '',
            maxMessage: editData.sms_max?.text || '',
            selectedTags: initialTag ? [initialTag] : [],
            newClientMonths: Number(editData.new_buyer) || 1,
            repeatMinutes: Number(editData.not_send) || 60,
            sendMode: mode,
            selectedAccount: accountValue.value,
            dailyLimit: editData.limit_sum != null ? String(editData.limit_sum) : '',
            wait_durat: editData?.wait_durat
        });

        setSelectedTags(initialTag ? [initialTag] : []);
    }, [editData, reset]);


    async function uploadMediaToS3(file: File | SmsMaxMedia): Promise<SmsMaxMedia> {
        // Если это уже SmsMaxMedia (старое изображение), возвращаем как есть
        if ('url' in file && 'filename' in file) {
            return file as SmsMaxMedia;
        }

        // Если это новый файл, загружаем
        const formData = new FormData();
        formData.append("media", file as File);

        const response = await fetch("https://smscard.b2b-help.ru/api/media/upload", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getTokenFromCookies()}`
            },
            body: formData
        });

        const result: UploadMediaResponse = await response.json();

        if (!result.success || !result.media) {
            console.error("UPLOAD ERROR:", result);
            throw new Error("Ошибка загрузки файла");
        }

        return result.media;
    }

    const onSubmit = async (data: FormValues) => {
        console.log('data', data)

        if (!getTokenFromCookies()) {
            alert("Нет JWT токена! Сначала авторизуйтесь.");
            return;
        }

        if (!data.selectedTags || data.selectedTags.length === 0) {
            setError("selectedTags", {type: "manual", message: "Выберите хотя бы один номер"});
            return;
        }

        const sms_type = modalType == "new" ? 1 : 2;
        console.log(sms_type)
        const new_buyer = sms_type === 1 ? Number(data.newClientMonths || 1) : null;
        const not_send = sms_type === 2 ? Number(data.repeatMinutes || 60) : null;

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

        const limit_sum = data.dailyLimit ? Number(data.dailyLimit) : null;

        const selectedPhone = selectedTags[0];

        const selectedGroup = accountsPhones.find(group =>
            group.numbers.some(n => n.phone === selectedPhone)
        );

        const nameId = selectedGroup?.name || null;

        const smsStats = calculateSmsStats(data.message || "");

        if (meth_sms && smsStats.isOverLimit) {
            setError("message", {
                type: "manual",
                message:
                    smsStats.characterSet === 'cyrillic'
                        ? "Превышен лимит: максимум 14 SMS для кириллицы"
                        : "Превышен лимит: максимум 6 SMS для латиницы"
            });
            return;
        }

        const smsCharCount = meth_sms
            ? calculateSmsStats(data.message || "").charCount
            : null;

        const cards = selectedTags.map(phone => {
            const group = accountsPhones.find(g =>
                g.numbers.some(n => n.phone === phone)
            );

            return {
                name_id: group?.name ?? null,
                avito_phone: phone
            };
        });


        const body: any = {
            sms_type,
            is_active: editData?.is_active ?? true,
            new_buyer,
            not_send,
            meth_sms,
            meth_max,
            max_account,
            limit_sum,
            num_of_char: smsCharCount,
        };

        if (type === 'new') {
            body.cards = cards;
        } else {
            body.avito_phone = selectedTags[0];
            body.name_id = nameId;
        }

        if (sms_type === 2) {
            body.wait_durat = data.wait_durat || 0;
        }

        if (meth_sms) {
            body.sms_text = data.message || "";
        } else {
            body.sms_text = null;
        }

        // Валидация текстов
        if (meth_sms && meth_max) {
            if (!data.message || !data.maxMessage) {
                setError("root.serverError", {
                    type: "manual",
                    message: "При режиме Smart необходимо заполнить оба текста: для СМС и для Max"
                });
                return;
            }
        }

        if (meth_sms && !meth_max && !data.message) {
            setError("message", {
                type: "manual",
                message: "Текст СМС обязателен при отправке только через СМС"
            });
            return;
        }

        if (!meth_sms && meth_max && !data.maxMessage) {
            setError("maxMessage", {
                type: "manual",
                message: "Текст для Max обязателен при отправке только через Max"
            });
            return;
        }

        try {
            let uploadedImages: SmsMaxMedia[] = [];

            // Обработка изображений для Max
            if (meth_max && images.length > 0) {
                uploadedImages = await Promise.all(
                    images.map(async (img) => {
                        // если это старое изображение → не загружаем повторно
                        if (!img.file) {
                            return {
                                url: img.url ?? "",
                                filename: img.filename ?? img.name,
                                mimetype: img.mimetype ?? "image/jpeg",
                                size: img.size ?? 0
                            };
                        }

                        // новая картинка → загружаем в S3
                        const meta = await uploadMediaToS3(img.file);

                        return {
                            url: meta.url,
                            filename: meta.filename,
                            mimetype: meta.mimetype,
                            size: meta.size
                        };
                    })
                );
            }

            // Формируем sms_max объект если используется Max
            if (meth_max) {
                body.sms_max = {
                    text: data.maxMessage || "",
                    images: uploadedImages,
                    videos: [],
                    files: []
                };
            } else {
                // Если Max не используется, передаем null
                body.sms_max = null;
            }

            console.log('Отправляемые данные:', JSON.stringify(body, null, 2));

            let response: Response;

            if (editData) {
                // Для обновления используем PUT с query параметрами
                const updateUrl = new URL("https://smscard.b2b-help.ru/api/sms-cards/update");
                updateUrl.searchParams.append("avito_phone", body.avito_phone);
                updateUrl.searchParams.append("sms_type", String(body.sms_type));

                console.log('Update URL:', updateUrl.toString());

                response = await fetch(updateUrl.toString(), {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getTokenFromCookies()}`
                    },
                    body: JSON.stringify(body)
                });
            } else {
                // Для добавления используем POST
                response = await fetch("https://smscard.b2b-help.ru/api/sms-cards/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getTokenFromCookies()}`
                    },
                    body: JSON.stringify(body)
                });
            }

            const text = await response.text();
            console.log("Raw response:", text);
            console.log("Status:", response.status, response.statusText);

            if (!response.ok) {
                let errorMsg = "Произошла неизвестная ошибка";

                try {
                    // Пытаемся распарсить JSON
                    const json = JSON.parse(text);
                    if (json.error) {
                        errorMsg = json.error;
                    } else if (json.message) {
                        errorMsg = json.message;
                    }
                } catch {
                    // Если не JSON, ищем ошибку в тексте
                    const match = text.match(/"error"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                    if (match) {
                        errorMsg = match[1];
                    } else {
                        errorMsg = text || "Ошибка сервера";
                    }
                }

                console.error("Ошибка сервера:", errorMsg);
                setError("root.serverError", {type: "manual", message: errorMsg});
                return;
            }

            console.log("Успешно:", text);

            if (onSuccess) {
                await onSuccess();
            }

            onClose();

        } catch (error) {
            console.error("Ошибка сети:", error);
            setError("root.serverError", {type: "manual", message: "Ошибка сети. Проверьте соединение."});
        }
    };

    const getEditPhone = (): string | null => {
        const phone = editData?.avito_phone;
        if (!phone) return null;

        if (Array.isArray(phone)) {
            return phone[0]?.replace(/\D/g, '') ?? null;
        }

        if (typeof phone === 'string') {
            return phone.replace(/\D/g, '');
        }

        return null;
    };

    const editPhone = getEditPhone();

    const isPhoneDisabled = (phone: string, already_exists: boolean) => {
        if (!already_exists) return false;

        if (type === 'edit') {
            return phone !== editPhone;
        }

        return true;
    };

    return (
        <div className="sms-modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>

            <div
                className="close-button"
                onClick={onClose}
            >
                <img src="/closeButonModal.svg" alt="closeButonModal.svg"/>
            </div>

            <div className="sms-modal-container" onClick={(e) => e.stopPropagation()}>



                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="sms-modal-header">
                        <div className="sms-modal-title-block">
                            <div className="sms-modal-title">СМС визитка</div>
                            <div className="sms-modal-subtitle">
                                {modalType === 'new'
                                    ? 'Добавление СМС-визитки новым клиентам'
                                    : 'Добавление СМС-извинения после пропущенного звонка'}
                            </div>
                        </div>
                    </div>

                    <div className="sms-modal-divider"/>

                    {/*Выберите номер */}
                    <div className="sms-section-select">
                        <div className="sms-section-title">Выберите номера</div>
                        <div className="sms-section-sub">
                            {modalType === 'new'
                                ? 'Мы отправим СМС-визитку после успешного звонка на этот номер'
                                : 'В случае пропущенного звонка на этот номер звонящему будет отправлено СМС-извинение. Извинение будет отправлено в рабочее время, настроенное для номера'}
                        </div>

                        {/* Кастомный select */}
                        <div
                            className={`sms-select ${selectedTags.length > 0 ? 'has-tags' : ''}`}
                            onClick={handleNumbersPopupOpen}
                        >
                            {selectedTags.length === 0
                                ? 'Выберите номер'
                                : `Выбрано: ${selectedTags.length}`}
                        </div>

                        {/* Выпадающий блок вместо модалки */}
                        {numbersPopupOpen && (
                            <div className="numbers-dropdown" ref={dropdownRef}>
                                {loadingAccounts ? (
                                    <div className="loading-row">Загружаем номера...</div>
                                ) : (
                                    <>
                                        {/* Все номера */}
                                        {type === 'new' && (
                                            <label className="all-numbers-row">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllNumbersSelected}
                                                    onChange={handleAllNumbersChange}
                                                />
                                                <span>Все номера</span>
                                            </label>
                                        )}

                                        {/* Аккаунты */}
                                        {accountsPhones.map((account: AccountPhonesGroup) => (
                                            <div key={account.id} className="account-block">
                                                <div
                                                    className="account-header"
                                                    onClick={() => {
                                                        setAccountsPhones(prev =>
                                                            prev.map(a =>
                                                                a.id === account.id ? {...a, open: !a.open} : a
                                                            )
                                                        );
                                                    }}
                                                >
                                                    <div className="acc-name">акк: {account.name}</div>
                                                    <div className="acc-right">
                                                        <span
                                                            className={`acc-count ${account.open ? 'open' : 'closed'}`}>
                                                            {account.numbers.length}
                                                        </span>
                                                        <img
                                                            src={account.open ? "/arr-acc-up.svg" : "/arr-acc-down.svg"}
                                                            alt=""
                                                            className="acc-arrow-icon"
                                                        />
                                                    </div>
                                                </div>

                                                {account.open && account.numbers.map(({ phone, already_exists }) => {
                                                    const disabled = isPhoneDisabled(phone, already_exists);

                                                    return (
                                                        <label
                                                            key={phone}
                                                            className={`number-row ${disabled ? 'disabled' : ''}`}
                                                        >
                                                            <input
                                                                type={'checkbox'}
                                                                name={type === 'edit' ? 'edit-phone' : undefined}
                                                                disabled={disabled}
                                                                checked={selectedTags.includes(phone)}
                                                                onChange={() => {
                                                                    if (disabled) return;

                                                                    if (type === 'edit') {
                                                                        setSelectedTags([phone]);
                                                                        setValue('selectedTags', [phone]);
                                                                    } else {
                                                                        handleSelectNumber(phone);
                                                                    }
                                                                }}
                                                            />
                                                            <span className="number-text">
                                                                {formatPhoneDisplay(phone)}
                                                            </span>

                                                            {already_exists && (
                                                                <span className="number-exists">
                                                                    {" "}уже добавлен
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}

                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Выбранные номера (теги) */}
                        <div className={`sms-tags-row ${selectedTags.length > 0 ? 'has-tags' : ''}`}>
                            {selectedTags.map((n) => (
                                <div
                                    key={n}
                                    className="sms-tag"
                                    onClick={() => handleRemoveTag(n)}
                                    title="Клик — убрать номер"
                                >
                                    {formatPhoneDisplay(n)}
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
                                    <div className="sms-tooltip-wrapperRadio">
                                        <img
                                            className="sms-card-title-img"
                                            src="/question.svg"
                                            alt="question"
                                            onClick={() => setShowTooltipRadio(prev => !prev)}
                                        />
                                        {showTooltipRadio && (
                                            <div className="sms-tooltipRadio">
                                                <img src="/Rectangle.svg" alt=""
                                                     className="sms-tooltip-triangleRadio"/>
                                                <div className="sms-tooltip-text">
                                                    Smart — приоритетный способ отправки в Max, если он не доступен,
                                                    то
                                                    визитка отправится по СМС
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <label className="sms-where-item">
                                    <input
                                        type="radio"
                                        value="sms"
                                        {...register('sendMode')}
                                        className="sms-round-radio"
                                    />
                                    <span className="sms-where-text">Только в СМС</span>
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

                            {watchSendMode !== 'sms' && (
                                <div className="sms-section account-row">
                                    <div className="sms-section-title-inline">С какого аккаунта отправлять</div>
                                    <Select
                                        options={maxAccounts}
                                        value={maxAccounts.find(opt => opt.value === watch('selectedAccount')) ?? selectedAccountValue}
                                        onChange={(selected: { value: string } | null) =>
                                            setValue('selectedAccount', selected?.value ?? "")
                                        }
                                        styles={defaultSelectStyles('240px')}
                                        onMenuOpen={() => fetchMaxAccounts()}
                                        isLoading={loadingMaxSelect}
                                    />
                                </div>
                            )}
                            {errors.selectedAccount && watchSendMode !== 'sms' && (
                                <div className="sms-error-text">{errors.selectedAccount.message}</div>
                            )}
                        </div>
                    </div>

                    {/* НОВЫЙ БЛОК: Укажите текст Сообщения в Max */}
                    {(watchSendMode === 'smart' || watchSendMode === 'max') && (
                        <div className="sms-card">
                            <div className="sms-card-top">
                                <div className="sms-card-title">Укажите текст Сообщения в Max</div>
                                <div className="sms-tooltip-wrapper">
                                    {/* Вопросик */}
                                    <img
                                        className="sms-card-title-img"
                                        src="/question.svg"
                                        alt="question"
                                        onClick={() => setShowTooltipMax((prev) => !prev)}
                                    />

                                    {/* Tooltip */}
                                    {showTooltipMax && (
                                        <div className="sms-tooltip">
                                            <img src="/Rectangle.svg" alt="" className="sms-tooltip-triangle"/>
                                            <div className="sms-tooltip-text">
                                                Введите текст сообщения для отправки через платформу Max.
                                                <br/>
                                                Сообщение будет отправлено через выбранный аккаунт Max.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sms-card-sub">Напишите сообщение для отправки через Max</div>

                            <textarea
                                className={`sms-textarea ${errors.maxMessage ? 'sms-input-error' : ''}`}
                                placeholder="Текст сообщения для Max..."
                                rows={4}
                                maxLength={1000}
                                {...register('maxMessage', {
                                    //@ts-ignore
                                    required: watchSendMode !== 'sms' ? 'Текст сообщения для Max обязателен' : false,
                                    minLength: {value: 5, message: 'Минимальная длина сообщения - 5 символов'},
                                    maxLength: {
                                        value: 1600,
                                        message: 'Максимальная длина сообщения - 1600 символов'
                                    },
                                })}
                            />


                            {errors.maxMessage && (
                                <div className="sms-error-text">{errors.maxMessage.message}</div>
                            )}

                            {/* 🔽 Блок прикрепления изображений */}
                            <div className="sms-images-upload">
                                <ImageUpload images={images} onChange={setImages} maxImages={5}/>
                            </div>


                            <div className="sms-stats">
                                <div>
                                    Символов: <span className="sms-accent">{watchMaxMessage?.length || 0}</span>
                                </div>
                            </div>

                        </div>
                    )}

                    {type === 'edit' && (
                        <RepeatInterval
                            title="Повторная отправка"
                            description="Не отправлять визитку повторно на тот же номер в течение"
                            unit="минут"
                            register={register}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                            fieldName="repeatMinutes"
                            //@ts-ignore
                            min={1}
                            max={60}
                            minMessage="Минимальное значение - 1 минута"
                            maxMessage="Максимальное значение - 60 минут"
                        />
                    )}

                    {/* Блок для текста СМС-визитки */}
                    {watchSendMode !== 'max' && <div className="sms-card">
                        <div className="sms-card-top">
                            <div className="sms-card-title">Укажите текст СМС-визитки</div>
                            <div className="sms-tooltip-wrapper">
                                {/* Вопросик */}
                                <img
                                    className="sms-card-title-img"
                                    src="/question.svg"
                                    alt="question"
                                    onClick={() => setShowTooltip(prev => !prev)}
                                />

                                {/* Tooltip */}
                                {showTooltip && (
                                    <div className="sms-tooltip">
                                        {/* Треугольник сверху справа */}
                                        <img src="/Rectangle.svg" alt="" className="sms-tooltip-triangle"/>

                                        <div className="sms-tooltip-text">
                                            Введите текст визитки, чтобы получить количество необходимых СМС для
                                            отправки.
                                            <br/>
                                            В 1 SMS помещается до 140 символов на английском языке и до 70 символов
                                            на
                                            русском.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sms-card-sub">Напишите сообщение новому клиенту</div>

                        <textarea
                            className={`sms-textarea ${errors.message ? 'sms-input-error' : ''}`}
                            placeholder="Текст..."
                            rows={4}
                            maxLength={1000}
                            {...register('message', {
                                //@ts-ignore
                                required: watchSendMode !== 'max' ? 'Текст сообщения обязателен' : false,
                                minLength: {
                                    value: 5,
                                    message: 'Минимальная длина сообщения - 5 символов'
                                },
                                maxLength: {
                                    value: 1600,
                                    message: 'Максимальная длина сообщения - 1600 символов'
                                }
                            })}
                        />
                        {/* Ошибка будет показываться только после попытки сабмита */}
                        {errors.message && (
                            <div className="sms-error-text">{errors.message.message}</div>
                        )}

                        <div className="sms-stats">
                            <div>
                                Символов: <span className="sms-accent">{smsStats.charCount}</span>
                                {smsStats.characterSet === 'cyrillic' && (
                                    <span className="sms-charset-info"> (кириллица)</span>
                                )}
                                {smsStats.characterSet === 'latin' && (
                                    <span className="sms-charset-info"> (латиница)</span>
                                )}
                            </div>
                            <div>
                                СМС: <span className="sms-accent">{smsStats.smsCount}</span>
                            </div>
                            <div className="sms-cost-with-tooltip">
                                Стоимость
                                {/* Вопросик */}
                                <img
                                    className="sms-card-title-img"
                                    src="/question.svg"
                                    alt="question"
                                    onClick={() => setShowTooltipSMS(prev => !prev)}
                                />

                                {/* Всплывающая подсказка */}
                                {showTooltipSMS && (
                                    <div className="sms-tooltip-bubble">
                                        <CostTooltip smsCount={smsStats.smsCount}/>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>}

                    {/* если type === 'new' — блок решите кого считать новым клиентом */}
                    {type === 'new' && (
                        <div className="sms-section" style={{width: '100%'}}>
                            <div className="sms-section-title">Решите кого мы будем считать новым клиентом</div>
                            <div className="sms-section-sub mb-12">
                                Считать клиента «новым»,<br/> если по его номеру не было звонков:
                            </div>

                            <Select
                                options={options}
                                value={options.find(opt => opt.value === watch('newClientMonths'))}
                                //@ts-ignore
                                onChange={(selected) => setValue('newClientMonths', selected.value)}
                                styles={defaultSelectStyles('100%')}
                            />

                            {errors.newClientMonths && (
                                <div className="sms-error-text">{errors.newClientMonths.message}</div>
                            )}
                        </div>
                    )}

                    {/* ✅ Показываем "Суточный лимит" только НЕ при "max" */}
                    {watchSendMode !== 'max' && (
                        <div className="sms-section">
                            <div className="sms-section-title">Суточный лимит на СМС</div>
                            <div className="sms-section-sub">
                                Сумма, которая может быть потрачена на эту визитку из кошелька платформы. При
                                достижении
                                лимита отправка визиток через СМС отключается
                            </div>

                            <input
                                className={`sms-full-input ${errors.dailyLimit ? 'sms-input-error' : ''}`}
                                placeholder="Сумма в ₽"
                                min="0"
                                step="0.01"
                                {...register('dailyLimit', {
                                    min: {value: 0, message: 'Лимит не может быть отрицательным'},
                                    pattern: {value: /^\d*\.?\d*$/, message: 'Введите корректную сумму'}
                                })}
                            />
                            {/* Ошибка будет показываться только после попытки сабмита */}
                            {errors.dailyLimit && (
                                <div className="sms-error-text">{errors.dailyLimit.message}</div>
                            )}
                        </div>
                    )}


                    {type === 'edit' && (
                        <RepeatInterval
                            title="Защита от спама"
                            description="Отправлять если ожидание на линии более"
                            unit="сек"
                            register={register}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                            fieldName="wait_durat"
                            //@ts-ignore
                            min={1}
                            max={60}
                            minMessage="Минимальное значение - 1 секунда"
                            maxMessage="Максимальное значение - 60 минут"
                        />
                    )}

                    {/* ✅ Ошибка сервера отображается тут */}
                    {errors.root?.serverError && (
                        <div className="sms-error-text" style={{marginTop: '8px'}}>
                            {errors.root.serverError.message}
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