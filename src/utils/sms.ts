const DOUBLE_CHARS = new Set(['{','}','[',']','^','~','\\','|','€']);

export type SmsCharacterSet = 'cyrillic' | 'latin';

export const detectCharset = (text: string): SmsCharacterSet =>
    /[а-яА-ЯёЁ]/.test(text) ? 'cyrillic' : 'latin';

export const calculateSmsStats = (text = '') => {
    if (!text) {
        return {
            charCount: 0,
            smsCount: 1,
            maxChars: 160,
            characterSet: 'latin' as SmsCharacterSet,
            isOverLimit: false
        };
    }

    const characterSet = detectCharset(text);

    const maxChars = characterSet === 'cyrillic' ? 70 : 160;
    const maxSms = characterSet === 'cyrillic' ? 14 : 6;

    let charCount = 0;
    for (const ch of text) {
        charCount += DOUBLE_CHARS.has(ch) ? 2 : 1;
    }

    const smsCount = Math.ceil(charCount / maxChars) || 1;

    return {
        charCount,
        smsCount,
        maxChars,
        characterSet,
        isOverLimit: smsCount > maxSms
    };
};
