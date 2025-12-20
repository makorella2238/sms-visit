// Функция для получения токена из куков
import Cookies from 'js-cookie';

export const getTokenFromCookies = (): string | undefined => {
    //@ts-ignore
    const tokenFromCookie: string | undefined = Cookies.get('token');

    if (tokenFromCookie) {
        console.log('[AUTH] Token взят из cookie:', tokenFromCookie);
        return tokenFromCookie;
    }

    console.warn('[AUTH] Token отсутствует в cookie',);
};
