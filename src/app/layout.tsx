import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../styles/globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from 'providers/theme-provider'

import { CalendarProvider } from '~/calendar/calendar-context'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Emploi du temps | IUT informatique d'Amiens",
  description:
    "Emploi du temps de l'IUT informatique d'Amiens parce que les autres sont explosés",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-sidebar font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CalendarProvider>{children}</CalendarProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
