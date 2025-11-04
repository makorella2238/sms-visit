import React, { useState } from 'react';
import './StatsPage.css';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const StatsPage = () => {
    const [sortField, setSortField] = useState<'date' | 'cost' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState('all');
    const [smsType, setSmsType] = useState('all');
    const [status, setStatus] = useState('all');
    const [isDownloading, setIsDownloading] = useState(false);

    const totalSent = 162;
    const visitsCount = 126;
    const apologiesCount = 36;
    const totalCost = 10000;

    const mockData = [
        {
            id: 1,
            date: '04-11-2024 12:40',
            fio: 'Фамилия Имя Отчество',
            account: 'Имя_аккаунта',
            phone: '+7 987 65-43-21',
            smsType: 'Визитка',
            message: 'Современные технологии достигли...',
            sent: 'max',
            status: 'отправлено',
            cost: '-'
        },
        {
            id: 2,
            date: '04-11-2024 12:40',
            fio: 'Фамилия Имя Отчество',
            account: 'Имя_аккаунта',
            phone: '+7 987 65-43-21',
            smsType: 'Извинение',
            message: 'Также как синтетическое тестирование...',
            sent: 'смс',
            status: 'доставленно',
            cost: '20'
        },
        {
            id: 3,
            date: '04-11-2024 12:40',
            fio: 'Фамилия Имя Отчество',
            account: 'Имя_аккаунта',
            phone: '+7 987 65-43-21',
            smsType: 'Извинение',
            message: 'В своём стремлении повысить качество...',
            sent: 'max',
            status: 'запрет на смс',
            cost: '-'
        },
        {
            id: 4,
            date: '04-11-2024 12:40',
            fio: 'Фамилия Имя Отчество',
            account: 'Имя_аккаунта',
            phone: '+7 987 65-43-21',
            smsType: 'Визитка',
            message: 'В рамках спецификации современных...',
            sent: 'смс',
            status: 'лимит',
            cost: '20'
        },
        {
            id: 5,
            date: '04-11-2024 12:40',
            fio: 'Фамилия Имя Отчество',
            account: 'Имя_аккаунта',
            phone: '+7 987 65-43-21',
            smsType: 'Визитка',
            message: 'Как уже неоднократно упомянуто...',
            sent: 'max',
            status: 'ошибка',
            cost: '-'
        }
    ];

    const sortedData = [...mockData].sort((a, b) => {
        if (!sortField) return 0;
        const direction = sortDirection === 'asc' ? 1 : -1;
        return (a[sortField] > b[sortField] ? 1 : -1) * direction;
    });

    const toggleSort = (field: 'date' | 'cost') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

// Внутри компонента StatsPage
    const downloadExcelXLSX = () => {
        const wsData = [
            ["Дата", "ФИО", "Аккаунт", "Телефон", "Тип SMS", "Текст", "Отправлено", "Статус", "Стоимость"],
            ...sortedData.map(r => [
                r.date, r.fio, r.account, r.phone, r.smsType, r.message, r.sent, r.status, r.cost
            ])
        ];

        // Создаём рабочий лист
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Настраиваем ширину столбцов
        ws['!cols'] = [
            { wch: 20 }, // Дата
            { wch: 25 }, // ФИО
            { wch: 20 }, // Аккаунт
            { wch: 15 }, // Телефон
            { wch: 15 }, // Тип SMS
            { wch: 50 }, // Текст сообщения
            { wch: 10 }, // Отправлено
            { wch: 15 }, // Статус
            { wch: 12 }  // Стоимость
        ];

        // Создаём книгу и добавляем лист
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Отчёт");

        // Генерируем файл и сохраняем
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), "sms_report.xlsx");
    };

    return (
        <div className="sms-statistics">
            {/* Верхний блок с фильтрами */}
            <div className="filters-section">
                <div className="filters-row">
                    <div className="filter-item search-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Поиск по телефону, аккаунту"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <img src="/search.svg" className="search-icon" alt="search"/>
                    </div>

                    <div className="filter-item">
                        <select
                            className="filter-select"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="today">Сегодня</option>
                            <option value="yesterday">Вчера</option>
                            <option value="week">Неделя</option>
                            <option value="month">Месяц</option>
                            <option value="all">Весь период</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <select
                            className="filter-select"
                            value={smsType}
                            onChange={(e) => setSmsType(e.target.value)}
                        >
                            <option value="all">Все типы</option>
                            <option value="visits">Визитка</option>
                            <option value="apologies">Извинение</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <select
                            className="filter-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="all">Все статусы</option>
                            <option value="sent">отправлено</option>
                            <option value="delivered">доставленно</option>
                            <option value="banned">запрет на смс</option>
                            <option value="limit">лимит</option>
                            <option value="error">ошибка</option>
                        </select>
                    </div>
                </div>

                <div className="info-row">
                    <div className="info-left">
                        <span className="info-item">
                            всего отправлено: <strong>{totalSent}</strong>
                        </span>
                        <span className="info-item">
                            визиток: <strong>{visitsCount}</strong> ({Math.round((visitsCount / totalSent) * 100)}%)
                        </span>
                        <span className="info-item">
                            извинений: <strong>{apologiesCount}</strong> ({Math.round((apologiesCount / totalSent) * 100)}%)
                        </span>
                        <span className="info-item">
                            общая стоимость: <strong>{totalCost.toLocaleString()} ₽</strong>
                        </span>
                    </div>

                    <div className="info-right">
                        <button
                            className={`download-btn ${isDownloading ? 'downloading' : ''}`}
                            onClick={downloadExcelXLSX}
                            disabled={isDownloading}
                        >
                            <img src="/download.svg" alt="Скачать"/>
                            <span>{isDownloading ? 'Скачивание...' : 'Скачать отчёт'}</span>
                            {isDownloading && <div className="download-progress"></div>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-section">
                <table className="sms-table">
                    <thead>
                    <tr>
                        <th onClick={() => toggleSort('date')} className="sortable">
                            <span>дата</span>
                            <img
                                src="/sort_table.svg"
                                className={`sort-icon ${sortField === 'date' ? sortDirection : ''}`}
                                alt="sort"
                            />
                        </th>
                        <th>ф.и.о.</th>
                        <th>аккаунт</th>
                        <th>телефон</th>
                        <th>смс-визитка</th>
                        <th>текст сообщения</th>
                        <th>отправлено</th>
                        <th>статус</th>
                        <th onClick={() => toggleSort('cost')} className="sortable">
                            <span>стоимость ₽</span>
                            <img
                                src="/sort_table.svg"
                                className={`sort-icon ${sortField === 'cost' ? sortDirection : ''}`}
                                alt="sort"
                            />
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedData.map((row, index) => (
                        <tr key={row.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                            <td className="small-cell">{row.date}</td>
                            <td className="small-cell">{row.fio}</td>
                            <td className="small-cell">{row.account}</td>
                            <td className="small-cell">{row.phone}</td>
                            <td className="small-cell">{row.smsType}</td>
                            <td className="small-cell message-cell">{row.message}</td>
                            <td className="big-cell">{row.sent}</td>
                            <td className="big-cell">
                                <span className={`status status-${row.status.replace(/\s+/g, '-')}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className="big-cell">{row.cost}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};