import type { Metadata, Viewport } from 'next'
import { Fredoka } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { AudioUnlock } from '@/components/AudioUnlock'
import './globals.css'

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'MathQuest Worlds - Math Adventure!',
  description:
    'A fun math learning adventure with multiple worlds to explore! Perfect for 2nd graders.',
  keywords: ['math', 'kids', 'learning', 'game', 'education', 'adventure'],
  authors: [{ name: 'MathQuest Worlds' }]
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility (vision impaired users)
  userScalable: true, // Enable zoom for accessibility
  viewportFit: 'cover', // Handle safe areas on notched devices
  themeColor: '#2D5016'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // Locale + messages come from i18n/request.ts (cookie-driven). The
  // `<html lang>` attribute is set dynamically so screen readers and
  // browser auto-translate match the actual rendered language.
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${fredoka.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AudioUnlock>{children}</AudioUnlock>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
