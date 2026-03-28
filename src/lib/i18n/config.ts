export const LOCALES = ['id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';
export const LOCALE_STORAGE_KEY = 'ptba-locale';
export const LOCALE_COOKIE_NAME = 'ptba-locale';
