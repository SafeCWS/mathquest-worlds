'use client'

import { NextIntlClientProvider } from 'next-intl'
import en from '@/i18n/messages/en.json'

// Operator ruling 2026-10-22: everything NEW in this prototype (OTP login, Big Multiplication,
// the tile that opens it) is English only. This forces locale 'en' for the subtree regardless of
// the `mathquest-locale` cookie, so useLocale() → 'en' (English read-aloud voice, en-US numbers,
// English stepScripts). Pre-existing pages keep their EN/ES toggle.
export function EnglishOnly({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  const Tag = inline ? 'span' : 'div'
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <Tag lang="en" className={inline ? undefined : 'contents'}>
        {children}
      </Tag>
    </NextIntlClientProvider>
  )
}
