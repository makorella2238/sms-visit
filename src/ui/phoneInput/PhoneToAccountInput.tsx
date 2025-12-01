import {useRef, useState} from "react";
import './PhoneToAccountInput.css'

interface AddPhoneToAccountInputProps {
    onAdd: (newNumber: string) => void;
    onCancel: () => void;
    accountId: string; // Добавьте это, если используете accountId
}

export function AddPhoneToAccountInput({ onAdd, onCancel }: AddPhoneToAccountInputProps) {
    const [phoneInputValue, setPhoneInputValue] = useState("");
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const [phoneError, setPhoneError] = useState("");

    const add = () => {
        const cleaned = phoneInputValue.replace(/\D/g, '');
        if (cleaned.length !== 11) {
            setPhoneError("Введите полный номер (11 цифр)");
            return;
        }

        const normalized = "+7" + cleaned.slice(1);

        onAdd(normalized);
    };

    return (
        <div className="phone-input-wrapper">
        <div className="phone-input-row">

            <input
                ref={phoneInputRef}
                type="tel"
                className={`sms-full-input ${phoneError ? 'sms-input-error' : ''}`}
                placeholder="+7 (___) ___-__-__"
                value={phoneInputValue}
                onFocus={() => {
                    if (!phoneInputValue || phoneInputValue === "+7") {
                        setPhoneInputValue("+7 (");
                        setTimeout(() => {
                            phoneInputRef.current?.setSelectionRange(4, 4);
                        }, 0);
                    } else {
                        const base = "+7 (";
                        if (phoneInputValue.startsWith(base)) {
                            setTimeout(() => {
                                phoneInputRef.current?.setSelectionRange(base.length, base.length);
                            }, 0);
                        }
                    }
                }}
                onChange={(e) => {
                    const value = e.target.value;
                    let digits = value.replace(/\D/g, '');

                    if (digits.startsWith('8')) digits = '7' + digits.slice(1);

                    if (digits.length === 0) {
                        setPhoneInputValue('');
                        return;
                    }

                    let formatted = '+7';
                    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
                    if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
                    if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
                    if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);

                    setPhoneInputValue(formatted);
                    setPhoneError("");
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                        e.preventDefault();
                        let digits = phoneInputValue.replace(/\D/g, '');
                        if (digits.length > 0) {
                            digits = digits.slice(0, -1);
                        }

                        let formatted = '+7';
                        if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
                        if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
                        if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
                        if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);

                        setPhoneInputValue(formatted);
                    }
                }}
                onBlur={() => {
                    const cleaned = phoneInputValue.replace(/\D/g, '');
                    if (cleaned.length > 0 && cleaned.length !== 11) {
                        setPhoneError("Введите полный номер (11 цифр)");
                    } else {
                        setPhoneError("");
                    }
                }}
            />

            <button
                type="button"
                className="sms-add-phone-btn"
                onClick={add}
            >
                Добавить
            </button>

            <button
                type="button"
                className="sms-add-phone-btn-cancel"
                onClick={onCancel}
            >
                Отмена
            </button>

        </div>
            {phoneError && <div className="sms-error-text">{phoneError}</div>}
        </div>
    );
}
