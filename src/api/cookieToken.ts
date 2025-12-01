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

    return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMmJoZWxwLnJ1IiwiaWF0IjoxNzY0MzM4ODk0LCJuYmYiOjE3NjQzMzg4OTQsImV4cCI6MTc2NDk0MzY5NCwidXNlcl9pZCI6NTg4N30.qBEilry3lbpq9h0PA4qE9Rc0F_vqcANi6agza4_d1mc'
};
