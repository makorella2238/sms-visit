import React, { useState } from 'react';
import {StatsPage} from "./components/StatsPage/StatsPage.tsx";
import {CardsPage} from "./components/CardsPage/CardPage.tsx";
import Header from "./components/Header/Header.tsx";
import {Tabs} from "./components/Tabs/Tabs.tsx";
import './App.css';


const App = () => {
    const [activeTab, setActiveTab] = useState('визитки');

    return (
        <div className="app">
            <Header />

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'визитки' && <CardsPage />}
            {activeTab === 'статистика' && <StatsPage />}
        </div>
    );
};

export default App;
