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

export const useAccountsPhones = (
    sms_type: number,
    enabled = false
) => {
    return useQuery({
        queryKey: ["accounts-phones", sms_type],
        queryFn: () => smsModal.getAccountsPhones(sms_type),
        staleTime: 1000 * 60 * 5,
        retry: 1,
        enabled
    });
};
