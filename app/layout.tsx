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
    'A math adventure for young learners. Earn stars and unlock new worlds as you grow.',
  keywords: ['math', 'kids', 'learning', 'game', 'education', 'adventure'],
  authors: [{ name: 'MathQuest Worlds' }],
  // PWA manifest — Next.js emits <link rel="manifest" href="/manifest.webmanifest">
  // and the iOS-specific tags below from this metadata block.
  manifest: '/manifest.webmanifest',
  // iOS "Add to Home Screen" support: status-bar style + home-screen icon.
  // `capable: true` makes the standalone window hide the Safari chrome.
  appleWebApp: {
    capable: true,
    title: 'MathQuest',
    statusBarStyle: 'default'
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
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
      <head>
        {/*
          Preconnect to Google Fonts so the TLS+DNS handshake to fonts.googleapis.com
          and fonts.gstatic.com starts in parallel with the HTML parse, instead of
          blocking until the CSS that references them lands. Drops first-paint font
          latency by ~50-100ms on cold connections — important on the office's
          50 Mbps hardware.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${fredoka.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AudioUnlock>{children}</AudioUnlock>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
