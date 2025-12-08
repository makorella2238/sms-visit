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

    // return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMmJoZWxwLnJ1IiwiaWF0IjoxNzY1MTkyNDgwLCJuYmYiOjE3NjUxOTI0ODAsImV4cCI6MTc2NTc5NzI4MCwidXNlcl9pZCI6NTg4N30.BsAL8Fs5rOh9doToq5NcPglwcR1qnWFEfAq8gp4pGCM'
};
