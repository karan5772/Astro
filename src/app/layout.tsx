import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ToastProvider';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      <html lang="en" className={cn("dark font-sans", geist.variable)}>
        <body>
          <div className="stars"></div>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  )
}
