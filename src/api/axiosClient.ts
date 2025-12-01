import axios from "axios";
import { getTokenFromCookies } from "./cookieToken";

export const api = axios.create({
    baseURL: "https://smscard.b2b-help.ru/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// автоматически вставляем JWT
api.interceptors.request.use((config) => {
    const token = getTokenFromCookies();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);
