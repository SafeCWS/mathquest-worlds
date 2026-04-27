import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

// next-intl server-side request config. Reads the `mathquest-locale`
// cookie set by the LanguageToggle and falls back to `en`.
//
// We deliberately do NOT use URL-prefixed locales (`/es/login`). Phase 1
// keeps the existing routes intact — the cookie is the only locale
// signal. This minimizes blast radius and lets the toggle work on any
// page without regenerating URLs.
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  const messages = (await import(`./messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
