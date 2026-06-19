import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naggare — Hiring, Humanised.',
  description: 'Mutual-match hiring. Persona. Craft. Learnability. Attitude.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
