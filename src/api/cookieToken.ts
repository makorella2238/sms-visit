// Функция для получения токена из куков
import Cookies from 'js-cookie';

export const getTokenFromCookies = (): string | undefined => {
    //@ts-ignore
    // const tokenFromCookie: string | undefined = Cookies.get('token');
    const tokenFromCookie = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMmJoZWxwLnJ1IiwiaWF0IjoxNzY2MzkxMjE5LCJuYmYiOjE3NjYzOTEyMTksImV4cCI6MTc2Njk5NjAxOSwidXNlcl9pZCI6NTg4N30.1TcUEiYDGVKb8bICNg5zJTs69ao6-7xbUjXtmcaeOwI'

    if (tokenFromCookie) {
        console.log('[AUTH] Token взят из cookie:', tokenFromCookie);
        return tokenFromCookie;
    }

    console.warn('[AUTH] Token отсутствует в cookie',);
};