import React, { useState, useEffect, useMemo } from 'react';
import './StatsPage.css';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { defaultSelectStyles } from "../../ui/config/selectStyles";
import Select from 'react-select';
import {useSmsStatistsEl} from "../../api/queries/statistics/statistics.ts";
import {MessageCell} from "../../ui/TooltipMessageCell/TooltipMessageCell.tsx";

interface ApiSmsData {
    id: number;
    created_at: string;
    buyer_phone: string;
    avito_phone: string;
    full_name?: string;
    account?: string;
    sms_type: number;
    sms_text: string;
    meth_sms: boolean;
    cost: number;
    meth_max: boolean;
    status: string;
    contact_id: number;

    title?: string;
    price?: number;
    url?: string;
}


interface TableRow {
    id: number;
    date: string;
    fio: string;
    account: string;
    buyerPhone: string;
    sellerPhone: string;
    smsType: string;
    message: string;
    sent: string;
    status: string;
    cost: string;

    adTitle: string;
    adPrice: string;
    adUrl: string;

    originalData: ApiSmsData;
}

interface SelectOption {
    value: string;
    label: string;
}

type SortField = 'date' | 'cost';
type SortDirection = 'asc' | 'desc';
type Period = 'all' | 'today' | 'yesterday' | 'week' | 'month';
type SmsType = 'all' | 'visits' | 'apologies';
type Status = 'all' | 'отправлено' | 'доставленно' | 'запрет на смс' | 'лимит' | 'ошибка';


export const StatsPage: React.FC = () => {
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [period, setPeriod] = useState<Period>('all');
    const [smsType, setSmsType] = useState<SmsType>('all');
    const [status, setStatus] = useState<Status>('all');
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [statsData, setStatsData] = useState<TableRow[]>([]);

    const {data, isLoading, error, refetch} = useSmsStatistsEl();

    const filteredData = useMemo(() => {
        const normalizedSearch = searchTerm.replace(/\D/g, '');
        const today: Date = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString: string = yesterday.toDateString();

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthStart: Date = new Date(today.getFullYear(), today.getMonth(), 1);

        return statsData.filter(item => {
            const itemDate: Date = new Date(item.originalData?.created_at);
            const itemDateString: string = itemDate.toDateString();

            // Фильтр по периоду
            if (period !== 'all') {
                if (period === 'today' && itemDateString !== today.toDateString()) return false;
                if (period === 'yesterday' && itemDateString !== yesterdayString) return false;
                if (period === 'week' && itemDate < weekAgo) return false;
                if (period === 'month' && itemDate < monthStart) return false;
            }

            const buyerPhoneDigits: string = item.buyerPhone.replace(/\D/g, '');
            const sellerPhoneDigits: string = item.sellerPhone.replace(/\D/g, '');
            const accountLower: string = item.account.toLowerCase();

            // Поиск по телефонам и аккаунту
            if (normalizedSearch) {
                if (!buyerPhoneDigits.includes(normalizedSearch) &&
                    !sellerPhoneDigits.includes(normalizedSearch) &&
                    !accountLower.includes(searchTerm.toLowerCase())) {
                    return false;
                }
            }

            // Фильтр по типу SMS
            if (smsType !== 'all') {
                if (smsType === 'visits' && item.smsType !== 'Визитка') return false;
                if (smsType === 'apologies' && item.smsType !== 'Извинение') return false;
            }

            // Фильтр по статусу
            if (status !== 'all') {
                if (item.status !== status) return false;
            }

            return true;
        });
    }, [statsData, searchTerm, smsType, status, period]);

    const sortedData = useMemo(() => {
        console.log('[sortedData] До сортировки:', filteredData.map(d => d.date));
        const result = [...filteredData].sort((a, b) => {
            const dateA = new Date(a.originalData?.created_at);
            const dateB = new Date(b.originalData?.created_at);

            const diff = sortDirection === 'desc'
                ? dateB.getTime() - dateA.getTime()
                : dateA.getTime() - dateB.getTime();

            console.log(`[sorting] ${a.originalData?.created_at} vs ${b.originalData?.created_at} = ${diff}`);
            return diff;
        });
        console.log('[sortedData] После сортировки:', result.map(d => d.date));
        return result;
    }, [filteredData, sortField, sortDirection]);

    console.log(sortedData)

    useEffect(() => {
        console.log('Table data:', sortedData);
        console.log('Columns count:', document.querySelectorAll('.sms-table th').length);
        console.log('First row cells count:', document.querySelectorAll('.sms-table tbody tr:first-child td').length);
    }, [sortedData]);

    useEffect(() => {
        if (Array.isArray(data)) {
            //@ts-ignore
            setStatsData(transformApiDataToTableFormat(data));
        }
    }, [data]);

// В функции transformApiDataToTableFormat изменим возвращаемый объект:
    const transformApiDataToTableFormat = (apiData: ApiSmsData[]): TableRow[] => {
        if (!apiData || !Array.isArray(apiData)) return [];

        return apiData.map((item) => ({
            id: item.id,
            date: formatDate(item.created_at),
            fio: item.full_name || 'Не указано',
            account: item.account || 'Не указано',
            adTitle: item.title || '—',
            adPrice: item.price ? `${item.price} ₽` : 'цена не указана',
            adUrl: item.url || '#',
            buyerPhone: formatPhone(item.buyer_phone),
            sellerPhone: formatPhone(item.avito_phone),
            smsType: getSmsTypeText(item.sms_type),
            message: item.sms_text || 'Сообщение не указано',
            sent: getSentType(item.meth_sms, item.meth_max),
            status: item.status || 'неизвестно',
            cost: item.cost !== undefined ? `${item.cost.toFixed(2)} ₽` : '-',
            originalData: item
        }));
    };

    // Вспомогательные функции для преобразования данных
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Не указано';
        try {
            const date = new Date(dateString);
            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = date.getUTCFullYear();
            const hours = date.getUTCHours().toString().padStart(2, '0');
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');

            return `${day}.${month}.${year} ${hours}:${minutes}`;
        } catch {
            return dateString;
        }
    };

    const formatPhone = (phone: string): string => {
        if (!phone) return 'Не указано';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('7')) {
            return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
        }
        return phone;
    };

    const getSmsTypeText = (smsType: number): string => {
        return smsType === 1 ? 'Визитка' : 'Извинение';
    };

    const getSentType = (methSms: boolean, methMax: boolean): string => {
        if (methSms && methMax) return 'smart';
        if (methSms && !methMax) return 'смс';
        if (!methSms && methMax) return 'max';
        return 'не указано';
    };

    const toggleSort = (field: SortField): void => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Расчет статистики из данных
    const calculatedStats = useMemo(() => {
        const totalSent = filteredData.length;
        const visitsCount = filteredData.filter(item => item.smsType === 'Визитка').length;
        const apologiesCount = filteredData.filter(item => item.smsType === 'Извинение').length;
        const totalCost = filteredData.reduce((sum, item) => {
            const cost = parseFloat(item.cost) || 0;
            return sum + cost;
        }, 0);

        return { totalSent, visitsCount, apologiesCount, totalCost };
    }, [filteredData]);

    const { totalSent, visitsCount, apologiesCount, totalCost } = calculatedStats;

    const downloadExcelXLSX = (): void => {
        setIsDownloading(true);

        try {
            const wsData = [
                ["Дата", "ФИО", "Аккаунт", "Покупатель", "Продавец", "Тип SMS", "Текст", "Отправлено", "Статус", "Стоимость"],
                ...sortedData.map(r => [
                    r.date, r.fio, r.account, r.buyerPhone, r.sellerPhone, r.smsType, r.message, r.sent, r.status, r.cost
                ])
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            ws['!cols'] = [
                { wch: 20 },
                { wch: 25 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 50 },
                { wch: 10 },
                { wch: 15 },
                { wch: 12 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Отчёт");

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([wbout], { type: "application/octet-stream" }), "sms_report.xlsx");
        } catch (err) {
            console.error('Ошибка при создании Excel:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    // Опции для селектов
    const periodOptions: SelectOption[] = [
        { value: 'all', label: 'Весь период' },
        { value: 'today', label: 'Сегодня' },
        { value: 'yesterday', label: 'Вчера' },
        { value: 'week', label: 'Неделя' },
        { value: 'month', label: 'Месяц' },
    ];

    const smsTypeOptions: SelectOption[] = [
        { value: 'all', label: 'Все типы' },
        { value: 'visits', label: 'Визитка' },
        { value: 'apologies', label: 'Извинение' },
    ];

    const statusOptions: SelectOption[] = [
        { value: 'all', label: 'Все статусы' },
        { value: 'отправлено', label: 'Отправлено' },
        { value: 'доставленно', label: 'Доставленно' },
        { value: 'запрет на смс', label: 'Запрет на смс' },
        { value: 'лимит', label: 'Лимит' },
        { value: 'ошибка', label: 'Ошибка' },
    ];

    if (isLoading) {
        return <div className="loading">Загрузка статистики...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>{error instanceof Error ? error.message : String(error)}</p>
                <button onClick={() => {refetch()}}>Повторить попытку</button>
            </div>
        );
    }

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
                        <Select<SelectOption>
                            options={periodOptions}
                            value={periodOptions.find(opt => opt.value === period)}
                            onChange={(selected) => setPeriod(selected?.value as Period)}
                            styles={{
                                ...defaultSelectStyles('100%'),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    <div className="filter-item">
                        <Select<SelectOption>
                            options={smsTypeOptions}
                            value={smsTypeOptions.find(opt => opt.value === smsType)}
                            onChange={(selected) => setSmsType(selected?.value as SmsType)}
                            styles={{
                                ...defaultSelectStyles('100%'),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    <div className="filter-item">
                        <Select<SelectOption>
                            options={statusOptions}
                            value={statusOptions.find(opt => opt.value === status)}
                            onChange={(selected) => setStatus(selected?.value as Status)}
                            styles={{
                                ...defaultSelectStyles('100%'),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>
                </div>

                <div className="info-row">
                    <div className="info-left">
                        <span className="info-item">
                            всего отправлено: <strong>{totalSent}</strong>
                        </span>
                        <span className="info-item">
                            визиток: <strong>{visitsCount}</strong> ({totalSent > 0 ? Math.round((visitsCount / totalSent) * 100) : 0}%)
                        </span>
                        <span className="info-item">
                            извинений: <strong>{apologiesCount}</strong> ({totalSent > 0 ? Math.round((apologiesCount / totalSent) * 100) : 0}%)
                        </span>
                        <span className="info-item">
                            общая стоимость: <strong>{totalCost.toLocaleString()} ₽</strong>
                        </span>
                    </div>

                    <div className="info-right">
                        <button
                            className={`download-btn ${isDownloading ? 'downloading' : ''}`}
                            onClick={downloadExcelXLSX}
                            disabled={isDownloading || sortedData.length === 0}
                        >
                            <img className='download-btn-icon' src="/download.svg" alt="Скачать"/>
                            <span className='text-down'>{isDownloading ? 'Скачивание...' : 'Скачать отчёт'}</span>
                            {isDownloading && <div className="download-progress"></div>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-section">
                {sortedData.length === 0 ? (
                    <div className="empty-state">
                        {statsData.length === 0 ? 'Нет данных для отображения' : 'Нет данных по выбранным фильтрам'}
                    </div>
                ) : (
                    <table className="sms-table">
                        <thead>
                        <tr className="table-header-row">
                            <th onClick={() => toggleSort('date')} className="sortable column-date">
                                <span>дата</span>
                                <img
                                    src="/sort_table.svg"
                                    className={`sort-icon ${sortField === 'date' ? sortDirection : 'inactive'}`}
                                    alt="sort"
                                />
                            </th>
                            <th>ф.и.о.</th>
                            <th>аккаунт</th>
                            <th>объявление</th>
                            <th>покупатель</th>
                            <th>продавец</th>
                            <th>статус</th>
                            <th className='line'>смс-визитка</th>
                            <th>текст сообщения</th>
                            <th>канал</th>
                            <th onClick={() => toggleSort('cost')} className="sortable">
                                <span>стоимость ₽</span>
                                <img
                                    src="/sort_table.svg"
                                    className={`sort-icon ${sortField === 'cost' ? sortDirection : 'inactive'}`}
                                    alt="sort"
                                />
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedData.map((row, index) => (
                            <tr key={row.id} className={`table-row tr-table ${index % 2 === 0 ? 'even' : 'odd'}`}>
                                <td className="small-cell">{row.date}</td>
                                <td className="small-cell">{row.fio}</td>
                                <td className="small-cell">{row.account}</td>
                                <td className="cell">
                                    <div
                                    >
                                        <div className="title-ob">{row.adTitle}</div>
                                        <div className="price line">{row.adPrice}</div>
                                    </div>
                                </td>

                                <td className="small-cell flex-td"
                                    style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span className='text-flex-center'>{row.buyerPhone}</span>
                                    <img className='arr-right' src="/arr-right.svg" alt="arr-right.svg"/>
                                </td>

                                <td className="small-cell">{row.sellerPhone}</td>
                                <td className="big-cell">
                                <span className={`status status-${row.status.replace(/\s+/g, '-')}`}>
                                  <MessageCell message={row.status}/>
                                </span>
                                </td>
                                <td className="small-cell">{row.smsType}</td>

                                <td className="small-cell">
                                    <MessageCell message={row.message}/>
                                </td>

                                <td className="big-cell">{row.sent}</td>

                                <td className="big-cell">{row.cost}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};