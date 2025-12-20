import React, { useEffect, useState } from 'react';
import './CardPage.css';
import { SmsModal } from "../Modal/SmsModal.tsx";
import {getTokenFromCookies} from "../../api/cookieToken.ts";
import {useSmsCardsEl} from "../../api/queries/smsCards/smsCards.tsx";

// Тип данных, которые приходят с сервера
interface ServerItem {
    wait_durat: number;
    id: number;
    is_active?: boolean;
    avito_phone: string;
    name_id?: string | null;
    limit_ost?: number;
    limit_sum?: number;
    sms_text: string;
    contact_id: number;
    sms_type: 1 | 2;
}

// Типизированная карточка
interface Card {
    id: number;
    active: boolean;
    phone: string;
    account: string;
    limit: string;
    description: string;
    contact_id: number;
    sms_type: 1 | 2;
    serverData: ServerItem;
}

// Пропсы для компонента карточки
interface CardComponentProps {
    card: Card;
    cardType: string;
    onToggleActive: (cardType: string, id: number) => void;
    onDelete: (cardType: string, id: number) => void;
    onEdit: (cardType: string, id: number) => void;
}

// Пропсы для компонента секции
interface SectionComponentProps {
    title: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    cards: Card[];
    cardType: string;
    onOpenModal: (cardType: string) => void;
    onToggleCardActive: (cardType: string, id: number) => void;
    onDeleteCard: (cardType: string, id: number) => void;
    onEditCard: (cardType: string, id: number) => void;
}

// Функция для форматирования телефона
// eslint-disable-next-line react-refresh/only-export-components
export const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('7')) {
        return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    }

    return phone;
};

export const CardsPage: React.FC = () => {

    const [isNewClientsExpanded, setIsNewClientsExpanded] = useState<boolean>(true);
    const [isApologyExpanded, setIsApologyExpanded] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalType, setModalType] = useState<string>('new');
    const [serverData, setServerData] = useState<ServerItem[]>([]);
    const [editCardData, setEditCardData] = useState<ServerItem | null>(null);

    // Запрос всех записей с передачей токена
    const {data, isLoading, error, refetch} = useSmsCardsEl()
    // ФИКС: Используем useEffect для обновления состояния
    useEffect(() => {
        if (data) {
            //@ts-ignore
            setServerData(data);
        }
    }, [data]); // ← Зависимость от data

    // Функция для маппинга карточек
    const mapToCard = (item: ServerItem): Card => ({
        id: item.id,
        active: item.is_active !== false,
        phone: item.avito_phone,
        account: item.name_id || 'Не указан',
        limit: `${item.limit_ost || 0} из ${item.limit_sum || 0} ₽`,
        description: item.sms_text,
        contact_id: item.contact_id,
        sms_type: item.sms_type,
        serverData: item
    });

    // "Визитка новым клиентам"
    const newClientCards: Card[] = serverData
        .filter((item: ServerItem): boolean => item.sms_type === 1)
        .map(mapToCard);

    // "Извинение за пропущенный звонок"
    const apologyCards: Card[] = serverData
        .filter((item: ServerItem): boolean => item.sms_type === 2)
        .map(mapToCard);

    // Функция для переключения активности карточки

    //@ts-ignore
    const toggleCardActive = async (cardType: string, id: number): Promise<void> => {
        try {
            const cardToUpdate: ServerItem | undefined = serverData.find(item => item.id === id);

            if (!cardToUpdate) {
                console.error('Карточка не найдена');
                return;
            }

            const newActiveState = !cardToUpdate.is_active;

            // ✅ ОПТИМИЗАЦИЯ: Сразу обновляем UI
            setServerData(prevData =>
                prevData.map(item =>
                    item.id === id
                        ? { ...item, is_active: newActiveState }
                        : item
                )
            );

            console.log('cardToUpdate', cardToUpdate)

            const normalizedPhone = cardToUpdate.avito_phone.replace(/^\+/, '');

            const updateUrl = new URL(`https://smscard.b2b-help.ru/api/sms-cards/update`);
            updateUrl.searchParams.append('avito_phone', normalizedPhone);
            updateUrl.searchParams.append('sms_type', cardToUpdate.sms_type.toString());

            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getTokenFromCookies()}`
                },
                body: JSON.stringify({
                    wait_durat: cardToUpdate.wait_durat, // ✅ В BODY
                    is_active: newActiveState
                })
            });


            if (!res.ok) {
                const errorText = await res.text();

                // ✅ ОПТИМИЗАЦИЯ: Если ошибка - откатываем изменения
                setServerData(prevData =>
                    prevData.map(item =>
                        item.id === id
                            ? { ...item, is_active: !newActiveState }
                            : item
                    )
                );

                throw new Error(`Ошибка обновления: ${res.status} - ${errorText}`);
            }

            const responseData = await res.json();
            console.log('Успешное обновление:', responseData);

        } catch (err) {
            console.error('Ошибка при переключении активности:', err);
        }
    };

    // Функция для удаления карточки
    //@ts-ignore

    const deleteCard = async (cardType: string, id: number): Promise<void> => {
        if (!window.confirm('Вы уверены, что хотите удалить эту карточку?')) return;

        try {
            const cardToDelete = serverData.find(item => item.id === id);
            if (!cardToDelete) throw new Error('Карточка не найдена');

            // ✅ ОПТИМИЗАЦИЯ: Сразу удаляем из UI
            setServerData(prevData => prevData.filter(item => item.id !== id));

            const params = new URLSearchParams({
                avito_phone: cardToDelete.avito_phone,
                sms_type: cardToDelete.sms_type.toString()
            });

            const deleteUrl = `https://smscard.b2b-help.ru/api/sms-cards/delete?${params}`;

            console.log('URL для удаления:', deleteUrl);

            const res = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getTokenFromCookies()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();

                // ✅ ОПТИМИЗАЦИЯ: Если ошибка - восстанавливаем данные
                setServerData(prevData => [...prevData, cardToDelete]);

                throw new Error(`Ошибка удаления: ${res.status} - ${errorText}`);
            }

            // Успешное удаление - данные уже обновлены в UI
        } catch (err) {
            console.error('Ошибка при удалении:', err);
        }
    };

    // Функция для редактирования карточки
    const handleEditCard = (cardType: string, id: number): void => {
        const cardToEdit = serverData.find(item => item.id === id);
        if (!cardToEdit) return;

        setModalType(cardType);
        setEditCardData(cardToEdit);
        setIsModalOpen(true);
    };

    // Компонент карточки для переиспользования
    const CardComponent: React.FC<CardComponentProps> = ({ card, cardType, onToggleActive, onDelete, onEdit }) => (
        <div key={card.id} className={`card ${card.active ? 'active' : 'inactive'}`}>
            <div className="card-left">
                <div className={`card-left-label ${!card.active ? 'inactive-text' : ''}`}>Позвонившим на:</div>
                <div className={`card-left-label ${!card.active ? 'inactive-text' : ''}`}>
                    {formatPhoneNumber(card.phone)}
                </div>
                {card.active && <div className="card-left-label">лимит {card.limit}</div>}
            </div>

            <div className={`description ${card.active ? 'active' : 'inactive'}`}>
                {card.description}
            </div>

            <div className="card-right">
                <div className="toggle-switch">
                    <div
                        className={`switch ${card.active ? 'on' : 'off'}`}
                        onClick={() => onToggleActive(cardType, card.id)}
                    >
                        <div className="switch-handle"></div>
                    </div>
                </div>
                    <>
                        <div className="icon edit-icon" onClick={() => onEdit(cardType, card.id)}>
                            <img src="/edit.svg" alt="Редактировать"/>
                        </div>
                        <div className="icon delete-icon" onClick={() => onDelete(cardType, card.id)}>
                            <img src="/trash.svg" alt="Удалить"/>
                        </div>
                    </>
            </div>
        </div>
    );

    // Компонент секции для переиспользования
    const SectionComponent: React.FC<SectionComponentProps> = ({
                                                                   title,
                                                                   isExpanded,
                                                                   onToggleExpand,
                                                                   cards,
                                                                   cardType,
                                                                   onOpenModal,
                                                                   onToggleCardActive,
                                                                   onDeleteCard,
                                                                   onEditCard
                                                               }) => (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
                <div className="section-actions">
                    <button className="add-button" onClick={() => onOpenModal(cardType)}>Добавить</button>
                    <a
                        className="collapse-button"
                        onClick={onToggleExpand}
                    >
                        <img
                            src="/collapse-button.svg"
                            alt={isExpanded ? "Свернуть" : "Развернуть"}
                            className={`collapse-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
                        />
                    </a>
                </div>
            </div>

            {isExpanded && (
                <div className="cards-container">
                    {cards.length > 0 ? (
                        cards.map(card => (
                            <CardComponent
                                key={card.id}
                                card={card}
                                cardType={cardType}
                                onToggleActive={onToggleCardActive}
                                onDelete={onDeleteCard}
                                onEdit={onEditCard}
                            />
                        ))
                    ) : (
                        <div className="empty-state">
                            {isLoading ? 'Загрузка...' : 'Пока нет добавленных карточек'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (isLoading) {
        return <div className="isLoading">Загрузка данных...</div>;
    }

    if (error) {
        console.log(error)
        return (
            <div className="error">
                <button onClick={() => refetch()}>Повторить попытку</button>
            </div>
        );
    }

    return (
        <div>
            {/* Основной контент */}
            <div className="main-content">
                {/* Блок "Визитка новым клиентам" */}
                <SectionComponent
                    title="Визитка новым клиентам"
                    isExpanded={isNewClientsExpanded}
                    onToggleExpand={() => setIsNewClientsExpanded(!isNewClientsExpanded)}
                    cards={newClientCards}
                    cardType="new"
                    onOpenModal={(type: string) => {
                        setModalType(type);
                        setEditCardData(null);
                        setIsModalOpen(true);
                    }}
                    onToggleCardActive={toggleCardActive}
                    onDeleteCard={deleteCard}
                    onEditCard={handleEditCard}
                />

                {/* Блок "Извинение за пропущенный звонок" */}
                <SectionComponent
                    title="Извинение за пропущенный звонок"
                    isExpanded={isApologyExpanded}
                    onToggleExpand={() => setIsApologyExpanded(!isApologyExpanded)}
                    cards={apologyCards}
                    cardType="apology"
                    onOpenModal={(type: string) => {
                        setModalType(type);
                        setEditCardData(null);
                        setIsModalOpen(true);
                    }}
                    onToggleCardActive={toggleCardActive}
                    onDeleteCard={deleteCard}
                    onEditCard={handleEditCard}
                />
            </div>

            {isModalOpen && (
                <SmsModal
                    //@ts-ignore
                    modalType={modalType}
                    type={editCardData?.id ? 'edit' : 'new'}
                    onClose={() => setIsModalOpen(false)}
                    //@ts-ignore
                    onSuccess={refetch}
                    //@ts-ignore
                    editData={editCardData}
                 />
            )}
        </div>
    );
};