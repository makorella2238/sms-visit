import './CostTooltip.css';
import { useSmsTariffs } from "../../api/queries/smsModal/smsModal.ts";

interface FreeSignTariff {
    MEGAFON: string;
    MTS: string;
    BEELINE: string;
    TELE2: string;
    OTHER: string;
}

export const CostTooltip = ({ smsCount }: { smsCount: number }) => {
    const { data, isLoading, isError, error } = useSmsTariffs();

    if (isLoading) {
        return (
            <div className="sms-tooltip-content">
                <div className="sms-tooltip-loading">Загрузка тарифов...</div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="sms-tooltip-content">
                <div className="sms-tooltip-header">Ошибка загрузки тарифов</div>
                <div className="sms-tooltip-error">
                    {(error as Error)?.message || "Не удалось получить тарифы"}
                </div>
            </div>
        );
    }

    // Т.к. data уже содержит FREE SIGN напрямую, просто приводим к FreeSignTariff
    const freeSign = data as FreeSignTariff;

    const prices: Record<string, number> = {
        "Мегафон": parseFloat(freeSign.MEGAFON || "0"),
        "МТС": parseFloat(freeSign.MTS || "0"),
        "Билайн": parseFloat(freeSign.BEELINE || "0"),
        "Tele2": parseFloat(freeSign.TELE2 || "0"),
        "Другие": parseFloat(freeSign.OTHER || "0")
    };

    return (
        <div className="sms-tooltip-content">
            <div className="sms-tooltip-header">Стоимость СМС по операторам</div>

            {Object.entries(prices).map(([operator, price]) => (
                <div key={operator} className="sms-tooltip-row">
                    <span className="sms-tooltip-operator">{operator}</span>
                    <span className="sms-tooltip-price">{(price * smsCount).toFixed(2)} ₽</span>
                </div>
            ))}

            <div className="sms-tooltip-note">*Цены указаны за {smsCount} СМС</div>
        </div>
    );
};
