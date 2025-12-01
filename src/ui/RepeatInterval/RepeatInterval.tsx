import '../../components/Modal/SmsModal.css'
import { useEffect, useState } from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';


interface RepeatIntervalProps {
    title?: string;
    description?: string;
    unit?: string;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    fieldName?: string;
}

export function RepeatInterval({
                                   title = 'Повторная отправка',
                                   description = 'Не отправлять визитку повторно на тот же номер в течение',
                                   unit = 'минут',
                                   register,
                                   errors,
                                   watch,
                                   setValue,
                                   fieldName = 'repeatMinutes'
                               }: RepeatIntervalProps) {
    // Локальное состояние для отслеживания значения
    const [localValue, setLocalValue] = useState<number>(Number(watch(fieldName)) || 1);

    useEffect(() => {
        const subscription = watch((value) => {
            setLocalValue(Number(value[fieldName]) || 1);
        });
        return () => subscription.unsubscribe();
    }, [watch, fieldName]);

    const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const current = localValue;
        if (current < 60) {
            const newValue = current + 1;
            setLocalValue(newValue);
            setValue(fieldName, newValue, { shouldValidate: true });
        }
    };

    const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const current = localValue;
        if (current > 1) {
            const newValue = current - 1;
            setLocalValue(newValue);
            setValue(fieldName, newValue, { shouldValidate: true });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setLocalValue(1);
            setValue(fieldName, 1, { shouldValidate: true });
            return;
        }

        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            if (numValue >= 1 && numValue <= 60) {
                setLocalValue(numValue);
                setValue(fieldName, numValue, { shouldValidate: true });
            }
        }
    };

    return (
        <div className="sms-section">
            <div className="sms-section-title">{title}</div>
            <div className="sms-repeat-row">
                <div className="sms-repeat-text">
                    {description}
                </div>
                <div className="sms-repeat-inputs">
                    <div className="number-wrapper">
                        <input
                            type="number"
                            min={1}
                            max={60}
                            step={1}
                            value={localValue}
                            className={`sms-number-input ${errors[fieldName] ? 'sms-input-error' : ''}`}
                            {...register(fieldName, {
                                required: 'Укажите интервал в минутах',
                                min: { value: 1, message: 'Минимальное значение - 1 минута' },
                                max: { value: 60, message: 'Максимальное значение - 60 минут' }
                            })}
                            onChange={handleInputChange}
                        />
                        <div className="custom-arrows">
                            <button
                                type="button"
                                className="arrow-up"
                                onClick={handleIncrement}
                            />
                            <button
                                type="button"
                                className="arrow-down"
                                onClick={handleDecrement}
                            />
                        </div>
                    </div>
                    <div className="sms-min-text">{unit}</div>
                </div>
            </div>
            {errors[fieldName] && (
                <div className="sms-error-text">{errors[fieldName]?.message?.toString()}</div>
            )}
        </div>
    );
}
