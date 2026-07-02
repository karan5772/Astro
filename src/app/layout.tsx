import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Astro AI',
  description: 'AI-powered astrology and horoscope readings with voice and text agents.',
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: 'Astro AI',
    description: 'AI-powered astrology and horoscope readings with voice and text agents.',
    images: [{ url: '/og.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astro AI',
    description: 'AI-powered astrology and horoscope readings with voice and text agents.',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("dark font-sans", poppins.variable)}>
        <body>
          <div className="stars"></div>
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
