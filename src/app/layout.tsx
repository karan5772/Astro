import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: 'Astro AI',
  description: 'AI-powered astrology and horoscope readings with voice and text agents.',
  icons: {
    icon: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="stars"></div>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  )
}
