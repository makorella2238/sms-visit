import {api} from "./axiosClient.ts";
import type {SmsMaxMedia} from "../types/types.ts";

interface TariffsResponse {
    success: boolean;
    data: {
        "FREE SIGN": {
            MEGAFON: string;
            MTS: string;
            BEELINE: string;
            TELE2: string;
            OTHER: string;
        };
    };
    message: string | null;
}

interface MaxAccount {
    id: number;
    name: string;
}

interface MaxAccountsResponse {
    success: boolean;
    data: MaxAccount[];
}

export interface AccountsPhone {
    sellerPhone: string;
    account_name: string;
    already_exists: boolean;
}
interface AccountsResponse {
    success: boolean;
    output: string;
}

interface UploadMediaResponse {
    success: boolean;
    media: SmsMaxMedia;
}

interface AddOrUpdateResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export const smsModal = {
    async getTariffs(): Promise<TariffsResponse['data']['FREE SIGN']> {
        const response = await api.get<TariffsResponse>("/smsaero/tariffs");

        if (!response.data.success || !response.data.data?.["FREE SIGN"]) {
            throw new Error("Некорректная структура данных от сервера");
        }

        return response.data.data["FREE SIGN"];
    },

    async getMaxAccounts(): Promise<MaxAccount[]> {
        const response = await api.get<MaxAccountsResponse>("/max-accounts");

        if (!response.data.success || !Array.isArray(response.data.data)) {
            throw new Error("Некорректный формат данных аккаунтов");
        }

        return response.data.data;
    },

    async getAccountsPhones(sms_type: number): Promise<AccountsPhone[]> {
        const response = await api.post<AccountsResponse>(
            `/avito_seller_phone?sms_type=${sms_type}`,
            {}
        );

        if (!response.data.success || !response.data.output) {
            throw new Error("Не удалось загрузить номера");
        }

        return JSON.parse(response.data.output);
    },


    /** ------------------------- НОВЫЕ API ---------------------------- */

    async uploadMedia(file: File): Promise<SmsMaxMedia> {
        const formData = new FormData();
        formData.append("media", file);


        const response = await api.post<UploadMediaResponse>("/media/upload", formData)

        if (!response.data.success || !response.data.media) {
            throw new Error("Ошибка загрузки файла");
        }

        return response.data.media;
    },

    async addSmsCard(body: never): Promise<AddOrUpdateResponse> {
        const response = await api.post("/sms-cards/add", body)
        return response.data;
    },

    async updateSmsCard(params: { body: never; avito_phone: string; sms_type: number }): Promise<AddOrUpdateResponse> {
        const response = await api.put(
            `/sms-cards/update?avito_phone=${params.avito_phone}&sms_type=${params.sms_type}`,
            params.body,
        );
        return response.data;
    }
};

export const smsStatistics = {

    async getStatisticsEl() {
        const response = await api.get<MaxAccountsResponse>("/sms-statistics/get");

        return response.data || [];
    }

}


export const smsCard = {

    async getCardEl() {
        const response = await api.get<MaxAccountsResponse>("/sms-cards/get");

        return response.data || [];
    }

}

