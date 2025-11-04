import React from "react";
import "./Header.css";

const Header = () => {
    return (
        <div className="header">
            <div className="header-left">
                <h1 className="title">СМС-визитка</h1>
                <div className="help-icon">
                    <img src="/question.svg" alt="Помощь" />
                </div>
            </div>

            <div className="header-right">
                <div className="instruction-container">
                    <div className="instruction">
                        <img src="/manual.svg" alt="Инструкция" />
                        <div className="instruction-text">Инструкция</div>
                    </div>
                </div>
                <div className="instruction-icon-con">
                    <img className="instruction-icon" src="/player.svg" alt="Видео" />
                </div>
            </div>
        </div>
    );
};

export default Header;
