import Cookies from 'js-cookie'

const TOKEN_EXPIRES = 2 // 2 ngày

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: TOKEN_EXPIRES,
  path: '/',
  sameSite: 'Lax',
  secure: window.location.protocol === 'https:',
}

export const tokenCookie = {
  getAccessToken: () => Cookies.get('accessToken') ?? null,
  getRefreshToken: () => Cookies.get('refreshToken') ?? null,

  setAccessToken: (token: string) => {
    Cookies.set('accessToken', token, COOKIE_OPTIONS)
  },
  setRefreshToken: (token: string) => {
    Cookies.set('refreshToken', token, COOKIE_OPTIONS)
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    Cookies.set('accessToken', accessToken, COOKIE_OPTIONS)
    Cookies.set('refreshToken', refreshToken, COOKIE_OPTIONS)
  },

  clearAll: () => {
    Cookies.remove('accessToken', { path: '/' })
    Cookies.remove('refreshToken', { path: '/' })
  },
}
