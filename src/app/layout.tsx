import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/components/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-sans' });

const BASE_URL = 'https://astro.karanchoudhary.dev';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f3ea' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Astro AI — Vedic Astrology Powered by AI',
    template: '%s | Astro AI',
  },
  description: 'Get personalised Vedic astrology readings powered by AI. Chat or speak with your birth chart — career, love, timing, and life path guidance grounded in Jyotish.',
  keywords: [
    'vedic astrology ai', 'jyotish ai', 'birth chart ai', 'astrology chatbot',
    'vedic horoscope', 'kundli ai', 'astrology prediction', 'jyotish chatbot',
    'ai astrologer', 'birth chart reading', 'vedic astrology online',
    'mahadasha prediction', 'dasha calculator', 'astrology voice ai',
  ],
  authors: [{ name: 'Astro AI', url: BASE_URL }],
  creator: 'Astro AI',
  publisher: 'Astro AI',
  category: 'astrology',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Astro AI',
    title: 'Astro AI — Vedic Astrology Powered by AI',
    description: 'Get personalised Vedic astrology readings powered by AI. Chat or speak with your birth chart — career, love, timing, and life path guidance grounded in Jyotish.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Astro AI — Vedic Astrology Powered by AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@astroai',
    creator: '@astroai',
    title: 'Astro AI — Vedic Astrology Powered by AI',
    description: 'Get personalised Vedic astrology readings powered by AI. Chat or speak with your birth chart.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    // google: 'your-google-verification-code', // add when needed
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Astro AI',
    url: BASE_URL,
    description: 'AI-powered Vedic astrology platform with personalised birth chart readings via chat and voice.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/chat?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astro AI',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'AI-powered Vedic astrology readings grounded in Jyotish and personalised birth chart data.',
    sameAs: [],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Astro AI',
    url: BASE_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    description: 'Chat or speak with an AI Vedic astrologer. Get personalised readings for career, love, timing, and life path — grounded in your actual Jyotish birth chart.',
    screenshot: `${BASE_URL}/og.png`,
    featureList: [
      'AI Vedic astrology chat',
      'Real-time voice astrology sessions',
      'Personalised birth chart (Kundli)',
      'Vimshottari Dasha period analysis',
      'Career, love, and timing predictions',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free tier with 10 messages. Paid plans available.',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Vedic astrology AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vedic astrology AI (Jyotish AI) uses your birth chart data — date, time, and place of birth — to generate personalised astrological readings. Unlike generic horoscopes, it analyses your actual planetary positions, Dasha periods, and house placements to answer specific questions about your life.',
        },
      },
      {
        '@type': 'Question',
        name: 'How accurate are AI astrology predictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Astro AI uses VedAstro, a classical Jyotish calculation engine, to compute your birth chart and Vimshottari Dasha periods from your exact birth details. The AI then interprets these real calculations — so every reading is grounded in your actual chart, not generic forecasts.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is Vimshottari Dasha?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vimshottari Dasha is the most widely used planetary period system in Vedic astrology. It divides your life into major periods (Mahadasha) ruled by specific planets, each lasting 6–20 years, with sub-periods (Bhukti) and further subdivisions. Your current Dasha reveals the dominant planetary influences on your life right now.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I ask about career, love, or timing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Astro AI answers questions about career growth, business timing, relationships, marriage, health, travel, and spiritual path — all grounded in your personalised Vedic birth chart and current planetary periods.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Astro AI support voice?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Astro AI includes a real-time voice session feature where you can speak naturally with an AI Vedic astrologer. The voice model has full access to your birth chart and Dasha periods, so responses are specific to you.',
        },
      },
      {
        '@type': 'Question',
        name: 'What birth details do I need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You need your date of birth, time of birth (as accurate as possible), and place of birth. These three inputs are used to calculate your complete Vedic birth chart — including all planetary positions, houses, and Dasha periods.',
        },
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to get a Vedic astrology reading with Astro AI',
    description: 'Step-by-step guide to getting a personalised Vedic astrology reading using AI.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Enter your birth details',
        text: 'Provide your date of birth, time of birth, and place of birth. This generates your complete Vedic birth chart (Kundli) with all planetary positions and Dasha periods.',
      },
      {
        '@type': 'HowToStep',
        name: 'Ask your question',
        text: 'Type or speak any question about your life — career, relationships, timing of events, health, or spiritual path. No astrology knowledge needed.',
      },
      {
        '@type': 'HowToStep',
        name: 'Receive a personalised reading',
        text: 'The AI references your actual birth chart and current Dasha period to give a specific, grounded answer — not a generic horoscope.',
      },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("dark font-sans", poppins.variable)}>
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
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
