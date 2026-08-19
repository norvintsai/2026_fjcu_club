import type { Metadata } from 'next'
import { Orbitron, JetBrains_Mono } from 'next/font/google'
import SplashScreen from '@/components/SplashScreen'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orb',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jb',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '輔仁大學社團適性測驗 // FJU STELLAR',
  description: '輔仁大學社團博覽會 — 社團適性測驗系統',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${orbitron.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
