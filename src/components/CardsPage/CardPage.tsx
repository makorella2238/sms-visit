import React, {useEffect, useState} from 'react';
import './CardPage.css';
import {SmsModal} from "../Modal/SmsModal.tsx";

export const CardsPage = () => {
    const [activeTab, setActiveTab] = useState('визитки');
    const [isNewClientsExpanded, setIsNewClientsExpanded] = useState(true);
    const [isApologyExpanded, setIsApologyExpanded] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('new'); // 'new' или 'apology'

    const [jwtToken, setJwtToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiY29udGFjdF9pZCI6MTIzLCJleHAiOjE3NjIzNTAyODQsImlhdCI6MTc2MjI2Mzg4NH0.HPC7JgKq2m2KINvN7GTFhCHYdMQ7jgjTpwvAnBdxldQ');

    const [serverData, setServerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editCardData, setEditCardData] = useState(null);

    // Запрос всех записей с передачей токена
    const getRecords = async () => {
        if (!jwtToken) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('https://smscard.b2b-help.ru/api/sms-cards', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            if (!res.ok) throw new Error(`Ошибка ${res.status}`);
            const data = await res.json();
            console.log('Все записи:', data);
            setServerData(data);
            setError(null);
        } catch (err) {
            console.error('Ошибка запроса:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getRecords();
    }, []);

// Данные для блока "Визитка новым клиентам" из сервера
    const newClientCards = serverData
        .filter(item => item.sms_type === 1) // 1 — визитка новым клиентам
        .map(item => ({
            id: item.id,
            active: item.is_active !== false,
            phone: item.avito_phone,
            account: item.name_id || 'Не указан',
            limit: `${item.limit_ost || 0} из ${item.limit_sum || 0} ₽`,
            description: item.sms_text,
            contact_id: item.contact_id,
            sms_type: item.sms_type,
            serverData: item
        }));

    // Данные для блока "Извинение за пропущенный звонок" из сервера
    const apologyCards = serverData
        .filter(item => item.sms_type === 2) // 2 — извинение за пропущенный звонок
        .map(item => ({
            id: item.id,
            active: item.is_active !== false,
            phone: item.avito_phone,
            account: item.name_id || 'Не указан',
            limit: `${item.limit_ost || 0} из ${item.limit_sum || 0} ₽`,
            description: item.sms_text,
            contact_id: item.contact_id,
            sms_type: item.sms_type,
            serverData: item
        }));


    // Функция для переключения активности карточки
    const toggleCardActive = async (cardType, id) => {
        try {
            // Находим карточку в исходных данных
            const cardToUpdate = serverData.find(item => item.id === id);
            if (!cardToUpdate) {
                console.error('Карточка не найдена');
                return;
            }

            const newActiveState = !cardToUpdate.is_active;

            // Формируем URL с параметрами согласно API
            const updateUrl = new URL(`https://smscard.b2b-help.ru/api/sms-cards/update`);
            updateUrl.searchParams.append('contact_id', cardToUpdate.contact_id);
            updateUrl.searchParams.append('avito_phone', cardToUpdate.avito_phone);
            updateUrl.searchParams.append('sms_type', cardToUpdate.sms_type);

            console.log('URL для обновления активности:', updateUrl.toString());
            console.log('Новое состояние активности:', newActiveState);

            // Отправляем запрос на обновление на сервер
            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({
                    is_active: newActiveState
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Ошибка обновления: ${res.status} - ${errorText}`);
            }

            const responseData = await res.json();
            console.log('Успешное обновление:', responseData);

            // Если успешно, обновляем локальные данные
            await getRecords(); // Перезагружаем данные с сервера

        } catch (err) {
            console.error('Ошибка при переключении активности:', err);
            setError('Не удалось обновить карточку');
        }
    };

    // Функция для удаления карточки
    const deleteCard = async (cardType, id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту карточку?')) return;

        try {
            const cardToDelete = serverData.find(item => item.id === id);
            if (!cardToDelete) throw new Error('Карточка не найдена');

            // Используем URLSearchParams для автоматического кодирования
            const params = new URLSearchParams({
                contact_id: cardToDelete.contact_id,
                avito_phone: cardToDelete.avito_phone,
                sms_type: cardToDelete.sms_type
            });

            const deleteUrl = `https://smscard.b2b-help.ru/api/sms-cards/delete?${params}`;

            console.log('URL для удаления:', deleteUrl);

            const res = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Ошибка удаления: ${res.status} - ${errorText}`);
            }

            await getRecords(); // Обновляем данные после удаления
        } catch (err) {
            console.error('Ошибка при удалении:', err);
            setError('Не удалось удалить карточку');
        }
    };


    // Функция для редактирования карточки (будет вызвана при клике на карандаш)
    const handleEditCard = (cardType, id) => {
        const cardToEdit = serverData.find(item => item.id === id);
        console.log(cardToEdit)
        if (!cardToEdit) return;

        setModalType(cardType); // тип: new/apology
        setEditCardData(cardToEdit); // сохраняем данные карточки
        setIsModalOpen(true); // открываем окно
    };


    // Компонент карточки для переиспользования
    const CardComponent = ({card, cardType, onToggleActive, onDelete, onEdit}) => (
        <div key={card.id} className={`card ${card.active ? 'active' : 'inactive'}`}>
            <div className="card-left">
                <div className="card-left-label">Позвонившим на:</div>
                <div className="card-left-label">{card.phone}</div>
                <div className="card-left-label bold">акк: {card.account}</div>
                {card.active && <div className="card-left-label">лимит: {card.limit}</div>}
            </div>

            <div className="card-center">
                <div className="description">{card.description}</div>
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
                {card.active && (
                    <>
                        <div className="icon edit-icon" onClick={() => onEdit(cardType, card.id)}>
                            <img src="/edit.svg" alt="Редактировать"/>
                        </div>
                        <div className="icon delete-icon" onClick={() => onDelete(cardType, card.id)}>
                            <img src="/trash.svg" alt="Удалить"/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // Компонент секции для переиспользования
    const SectionComponent = ({
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
                            {loading ? 'Загрузка...' : 'Пока нет добавленных карточек'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (loading) {
        return <div className="loading">Загрузка данных...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>{error}</p>
                <button onClick={getRecords}>Повторить попытку</button>
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
                    onOpenModal={(type) => {
                        setModalType(type);
                        setEditCardData(null); // ← сбрасываем данные редактирования
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
                    onOpenModal={(type) => {
                        setModalType(type);
                        setEditCardData(null); // ← сбрасываем данные редактирования
                        setIsModalOpen(true);
                    }}
                    onToggleCardActive={toggleCardActive}
                    onDeleteCard={deleteCard}
                    onEditCard={handleEditCard}
                />
            </div>

            {isModalOpen && (
                <SmsModal
                    type={modalType}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={getRecords} // Перезагружаем данные после добавления
                    jwtToken={jwtToken}
                    editData={editCardData} // ← вот это важно
                />
            )}
        </div>
    );
};