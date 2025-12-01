export interface ImageFile {
    id: string;
    file?: File;
    preview: string;
    name: string;
    url?: string;
    mimetype?: string;
    size?: number;
    filename?: string;
}

export interface SmsMaxMedia {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
}

export interface SmsMaxContent {
    text: string;
    images: SmsMaxMedia[];
    videos: any[];
    files: any[];
}

export interface EditData {
    wait_durat: number;
    spamProtection: string;
    avito_phone: string;
    sms_text?: string;
    sms_max?: SmsMaxContent;
    new_buyer?: number;
    not_send?: number;
    meth_sms: boolean;
    meth_max: boolean;
    max_account?: string | { id: string; name: string }[];
    limit_sum?: number;
    sms_type: number;
    is_active: boolean
    max_account_name?: string;
}

export interface AccountPhonesGroup {
    id: string;
    name: string;
    numbers: string[];
    open: boolean;
    addPhoneMode: boolean;
}

export interface SmsModalProps {
    type?: 'new' | 'apology';
    onClose: () => void;
    editData?: EditData | null;
    //@ts-ignore
    onSuccess?: () => (options?: RefetchOptions) => Promise<QueryObserverResult<[T | any[]][T extends any ? 0 : never | any[] extends any ? 0 : never], Register extends {
        defaultError: infer TError
    } ? TError : Error>>;
}

export interface FormValues {
    newClientMonths: number;
    message: string;
    maxMessage: string;
    sendMode: 'smart' | 'sms' | 'max';
    selectedAccount: string;
    dailyLimit: string;
    repeatMinutes: number;
    selectedTags: string[];
    wait_durat: number
}