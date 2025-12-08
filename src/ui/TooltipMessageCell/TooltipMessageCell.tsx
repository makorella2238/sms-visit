import React, { useState} from "react";
import ReactDOM from "react-dom";
import "./TooltipMessageCell.css"; // подключаем отдельный файл стилей

interface MessageCellProps {
    message: string;
}

export const MessageCell: React.FC<MessageCellProps> = ({ message }) => {
    const [hover, setHover] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    return (
        <div
            className="small-cell message-cell"
            onMouseEnter={e => {
                setHover(true);
                const rect = e.currentTarget.getBoundingClientRect();
                setCoords({ x: rect.left, y: rect.bottom });
            }}
            onMouseLeave={() => setHover(false)}
        >
            <span className="message-cell-content">
                {message.length > 20 ? message.slice(0, 20) + '...' : message}
            </span>

            {hover &&
                ReactDOM.createPortal(
                    <div
                        className="message-tooltip"
                        style={{ top: coords.y + 4, left: coords.x }}
                    >
                        {message}
                    </div>,
                    document.body
                )}
        </div>
    );
};
