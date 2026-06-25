import type { Metadata } from 'next'
import './globals.css'
import IdleTimer from '@/components/IdleTimer'
import AuthRedirect from '@/components/AuthRedirect'

export const metadata: Metadata = {
  title: 'Naggare — Hiring, Humanised.',
  description: 'Mutual-match hiring. Persona. Craft. Learnability. Attitude.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
      <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-screen bg-gray-50">
        {children}
        <AuthRedirect />
        <IdleTimer />
      </body>
    </html>
  )
}
