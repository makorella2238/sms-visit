import React from "react";
import "./Tabs.css";

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}



export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="tabs-container">
            <div className="tabs">
                <button
                    className={`tab ${activeTab === "визитки" ? "active" : ""}`}
                    onClick={() => setActiveTab("визитки")}
                >
                    Визитки
                </button>

                <button
                    className={`tab ${activeTab === "статистика" ? "active" : ""}`}
                    onClick={() => setActiveTab("статистика")}
                >
                    Статистика
                </button>
            </div>
        </div>
    );
};
