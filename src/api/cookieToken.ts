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

    // return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMmJoZWxwLnJ1IiwiaWF0IjoxNzY0NjEyNDU4LCJuYmYiOjE3NjQ2MTI0NTgsImV4cCI6MTc2NTIxNzI1OCwidXNlcl9pZCI6NTg4N30.--iCZ_xaqIFkm7rKezIKiY2PDIDZQUp7v_4k7OGicHo'
};
