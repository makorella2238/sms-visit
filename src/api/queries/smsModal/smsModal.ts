import { useQuery } from "@tanstack/react-query";
import {smsModal} from "../../api.ts";

export const useSmsTariffs = () => {
    return useQuery({
        queryKey: ["sms-tariffs"],
        queryFn: smsModal.getTariffs,
        staleTime: 1000 * 60 * 10, // кеш 10 минут
        retry: 1
    });
};

export const useMaxAccounts = () => {
    return useQuery({
        queryKey: ["max-accounts"],
        queryFn: smsModal.getMaxAccounts,
        staleTime: 1000 * 60 * 5, // кеш 5 минут
        retry: 1
    });
};

export const useAccountsPhones = ({
                                      sms_type,
                                      type,
                                      current_phone,
                                      enabled = false
                                  }: {
    sms_type: number;
    type: 'new' | 'edit';
    current_phone?: string | null;
    enabled?: boolean;
}) => {
    return useQuery({
        queryKey: [
            'accounts-phones',
            type,
            sms_type,
            type === 'edit' ? current_phone : null
        ],
        queryFn: () => {
            if (type === 'edit') {
                if (!current_phone) {
                    throw new Error('current_phone is required for edit');
                }
                return smsModal.getAccountsPhonesForEdit(
                    sms_type,
                    current_phone
                );
            }

            return smsModal.getAccountsPhones(sms_type);
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
        enabled
    });
};
