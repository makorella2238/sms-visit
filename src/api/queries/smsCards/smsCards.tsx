import { useQuery } from "@tanstack/react-query";
import {smsCard, } from "../../api.ts";

export const useSmsCardsEl = () => {
    return useQuery({
        queryKey: ["sms-card"],
        queryFn: smsCard.getCardEl,
        staleTime: 1000 * 60 * 60 * 3, // 3 часа
        retry: 1
    });
};