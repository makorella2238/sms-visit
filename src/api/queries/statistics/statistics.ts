import { useQuery } from "@tanstack/react-query";
import {smsStatistics} from "../../api.ts";

export const useSmsStatistsEl = () => {
    return useQuery({
        queryKey: ["sms-statistics"],
        queryFn: smsStatistics.getStatisticsEl,
        staleTime: 1000 * 60 * 60 * 3, // 3 часа
        retry: 1
    });
};