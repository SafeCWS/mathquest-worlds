// Locale config for next-intl (cookie-based locale, no URL prefix).
// Phase 1 ships en + es. Add new locales by appending to `locales`
// and creating `i18n/messages/<locale>.json`.

export const locales = ['en', 'es'] as const
export const defaultLocale = 'en' as const

export type Locale = (typeof locales)[number]

// Cookie name used by LanguageToggle and i18n/request.ts to persist
// the user's locale choice across reloads. 1-year max-age.
export const LOCALE_COOKIE = 'mathquest-locale'

// BCP-47 tags for Intl.DateTimeFormat / toLocaleDateString. en-US for English
// (existing behavior), es-ES for Spanish (closer to international school
// Spanish than es-MX, and matches our tú-form tone).
export const LOCALE_BCP47: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
