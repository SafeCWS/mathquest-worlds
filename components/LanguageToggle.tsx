'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { locales, LOCALE_COOKIE, type Locale } from '@/i18n/config'

// Pill-shaped EN/ES toggle. Persists choice in the `mathquest-locale`
// cookie (1 year). Calls router.refresh() so server components re-render
// with the new locale — no full page reload, no flicker on Next 16.
export function LanguageToggle() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = useTranslations('languageToggle')

  const setLocale = (next: Locale) => {
    if (next === locale) return
    // 1 year, lax SameSite so it survives navigation but not cross-site.
    // Path=/ so every page reads the same value. Secure flag in HTTPS so
    // browsers refuse to send this preference cookie over plain HTTP.
    const oneYearSeconds = 60 * 60 * 24 * 365
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${oneYearSeconds}; SameSite=Lax${secure}`
    router.refresh()
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm
                 rounded-full shadow-md text-sm"
    >
      <span className="text-base" aria-hidden="true">🌐</span>
      {locales.map((loc) => {
        const isActive = loc === locale
        const labelKey = loc === 'es' ? 'spanish' : 'english'
        return (
          <motion.button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-pressed={isActive}
            className={`px-2 py-0.5 rounded-full font-bold transition-colors ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow'
                : 'text-gray-600 hover:bg-white/60'
            }`}
            whileHover={{ scale: isActive ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t(labelKey)}
          </motion.button>
        )
      })}
    </div>
  )
}
