export const normalizePhone = (value?: string | null) =>
    value?.replace(/\D/g, '') ?? null;

export const formatPhone = (digits: string) => {
    if (digits.length !== 11) return digits;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
};
