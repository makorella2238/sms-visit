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

    // return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMmJoZWxwLnJ1IiwiaWF0IjoxNzY2MTUzNzcwLCJuYmYiOjE3NjYxNTM3NzAsImV4cCI6MTc2Njc1ODU3MCwidXNlcl9pZCI6NTg4N30.z4Lz6RRM58ZrfmofrjTtWpiqmuiemUYAwhdoRviy9Z8'
};
