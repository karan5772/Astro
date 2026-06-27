# Astro — Project Architecture & Roadmap

> Vedic astrology SaaS with AI text chat, voice readings, and natal chart generation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Auth | Clerk (`@clerk/nextjs` v7) |
| Database | MongoDB via Mongoose |
| Text AI | OpenAI `gpt-4.1-nano` (Vercel AI SDK) |
| Voice AI | OpenAI Realtime API (`gpt-realtime-mini`) over WebRTC |
| Astrology API | VedAstro REST API (external) |
| Geocoding | OpenStreetMap Nominatim (free, no key) |
| Payments | Razorpay (INR, HMAC-sha256 verification) |
| UI | Tailwind CSS v4 + Framer Motion + Lucide React |
| Middleware | Clerk (protects `/chat`, `/voice`) |

---

## Directory Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── layout.tsx                        # Root layout (Clerk + ToastProvider)
│   ├── globals.css
│   ├── pricing/page.tsx                  # Plan selection + Razorpay checkout
│   ├── profile/page.tsx                  # Birth params, stats, payment history
│   ├── chat/page.tsx                     # Text chat (SSE streaming)
│   ├── chart/page.tsx                    # Natal chart generator (SVG)
│   ├── voice/
│   │   ├── layout.tsx                    # Server-side Pro guard
│   │   └── page.tsx                      # WebRTC voice session
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── cancellation/page.tsx
│   └── api/
│       ├── chat/route.ts                 # Streaming text AI
│       ├── chart/route.ts                # VedAstro SVG proxy
│       ├── geocode/route.ts              # Nominatim proxy
│       ├── razorpay/route.ts             # Order creation
│       ├── verify-payment/route.ts       # HMAC verification + DB update
│       ├── realtime-session/route.ts     # OpenAI ephemeral key + system prompt
│       └── user/
│           ├── route.ts                  # Upsert user, save birth details
│           └── voice-heartbeat/route.ts  # Decrement voice balance (10s tick)
├── components/
│   ├── Navbar.tsx                        # Landing nav (scroll-aware, mobile hamburger)
│   ├── Sidebar.tsx                       # App sidebar (collapsible, plan badge)
│   ├── Footer.tsx                        # Landing footer
│   ├── ToastProvider.tsx                 # Global react-hot-toast with dark theme
│   └── AiChatInput.tsx                   # (Unused — inline inputs used instead)
├── lib/
│   ├── mongodb.ts                        # Mongoose connection singleton
│   └── models/
│       ├── User.ts                       # User schema
│       └── Payment.ts                    # Payment schema
└── proxy.ts                              # Clerk middleware (misnamed, should be middleware.ts)
```

---

## Data Models

### User
```
clerkId (unique)    email               firstName / lastName
isPro               messageCount        voiceBalanceInSeconds
birthDate           birthTime           birthTimezone
birthLocation       birthLatitude       birthLongitude
predictions[]       → { name, description, tags[] }
```
- `isPro` is `true` while `voiceBalanceInSeconds > 0`
- `messageCount` tracks free text messages (limit: 15)
- `predictions[]` is fetched from VedAstro and stored on birth detail save

### Payment
```
clerkId    paymentId (unique)    orderId
amount     durationInMinutes     date
```

---

## Pages

### Public
| Route | Description |
|---|---|
| `/` | Animated hero, orbital demo tabs (chart / oracle / transits), feature cards, how-it-works |
| `/pricing` | Three one-time passes — $2/5min, $5/15min, $10/40min — Razorpay checkout |
| `/sign-in`, `/sign-up` | Clerk catch-all auth pages |
| `/privacy`, `/terms`, `/cancellation` | Static legal pages |

### Authenticated (Clerk-protected)
| Route | Description |
|---|---|
| `/chat` | Text chat with SSE streaming. Onboarding gate if no birth details. Free: 15 messages, then → `/pricing` |
| `/chart` | Birth chart generator. Date/time/location → VedAstro SVG. Supports download + print |
| `/voice` | WebRTC voice session with OpenAI Realtime. Pro-only. 10s heartbeat decrements balance. Auto-redirects on exhaustion |
| `/profile` | Edit birth details, view usage stats (messages, voice minutes), payment history, "Cosmic Origins" panel |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Stream `gpt-4.1-nano` with birth data + predictions[0..25] in system prompt. Enforces 15-msg free limit |
| `/api/chart` | POST | Proxy VedAstro `/Calculate/SouthIndianChart` (Rasi D-1, RAMAN ayanamsa). Returns SVG |
| `/api/geocode` | GET | Proxy Nominatim `?q=`. Returns `[{name, latitude, longitude}]` |
| `/api/razorpay` | POST | Create Razorpay order (USD → INR at 83x fixed rate) |
| `/api/verify-payment` | POST | HMAC verify → create Payment doc → set `isPro=true` + increment `voiceBalanceInSeconds` |
| `/api/user` | GET | Fetch/upsert user doc, check Pro expiry, return full profile + payments |
| `/api/user` | POST | Save birth details → call VedAstro HoroscopePredictions → store `predictions[]` |
| `/api/user/voice-heartbeat` | POST | Decrement `voiceBalanceInSeconds` by 10. Set `isPro=false` if balance hits 0 |
| `/api/realtime-session` | GET | Pro check → build system prompt (predictions[20..55]) → fetch OpenAI ephemeral key |

---

## Core Data Flows

### Onboarding / Birth Details
```
User submits birth form
  → POST /api/user
  → VedAstro HoroscopePredictions API
  → Store predictions[] in MongoDB
  → Return updated user doc
```

### Text Chat
```
User sends message
  → POST /api/chat
  → Check messageCount (free limit: 15)
  → Build system prompt (birth details + predictions[0..25])
  → streamText(gpt-4.1-nano)
  → SSE stream → client
```

### Voice Session
```
User clicks Start
  → GET /api/realtime-session (Pro check)
  → Build system prompt (predictions[20..55])
  → Fetch ephemeral key from OpenAI Realtime
  → Client: RTCPeerConnection created
  → POST offer.sdp → api.openai.com/v1/realtime/calls
  → setRemoteDescription(answer)
  → 10s heartbeat → POST /api/user/voice-heartbeat (decrement DB)
  → Balance = 0 → isPro=false → redirect /pricing
```

### Payment
```
User picks plan
  → POST /api/razorpay (create order)
  → Razorpay checkout popup
  → On success → POST /api/verify-payment
  → HMAC verify
  → Create Payment doc
  → $inc voiceBalanceInSeconds + $set isPro=true
  → Redirect → /chat
```

---

## Known Issues & Tech Debt

| Issue | Location | Severity |
|---|---|---|
| Razorpay auth check commented out — unauthenticated users can create orders | `/api/razorpay/route.ts` | High |
| Hardcoded USD→INR exchange rate (`83`) — not dynamic | `/api/razorpay/route.ts` | Medium |
| Voice balance drift — optimistic 1s client decrement + authoritative 10s DB decrement can diverge on disconnect | `voice/page.tsx` + `voice-heartbeat` | Medium |
| No rate limiting on `/api/geocode` — Nominatim has usage policy limits | `/api/geocode/route.ts` | Medium |
| `AiChatInput.tsx` is unused — chat pages build their own inputs inline | `components/AiChatInput.tsx` | Low |
| `src/proxy.ts` should be `src/middleware.ts` per Next.js convention | `src/proxy.ts` | Low |
| Timezone dropdown in `chart/page.tsx` has only 5 options vs. full list in `chat/page.tsx` | `app/chart/page.tsx` | Low |
| AI SDK tools in `/api/chat` are commented out pending JSON schema bug | `/api/chat/route.ts` | Low |
| `getMockPlacements()` computed in chat but never rendered | `app/chat/page.tsx` | Low |
| Sidebar collapse state via `localStorage` + custom DOM event — no React state management | `components/Sidebar.tsx` | Low |

---

## Future Objectives & Improvements

### P0 — Security & Correctness
- [ ] **Fix Razorpay auth** — restore the `userId` guard on `/api/razorpay` so anonymous users cannot create orders
- [ ] **Voice balance reconciliation** — on disconnect, send a final heartbeat with the exact elapsed seconds rather than relying on the 10s tick leaving a residual balance
- [ ] **Signature replay protection** — store verified `paymentId` values and reject duplicates in `/api/verify-payment`

### P1 — Core Feature Completeness
- [ ] **Enable AI tools in chat** — resolve the Vercel AI SDK JSON schema issue and wire up the commented-out tools (e.g., ephemeris lookup, transit query)
- [ ] **Real ephemeris in chat** — replace `getMockPlacements()` with an actual VedAstro planetary positions call and surface it in the UI
- [ ] **Full timezone support in Chart** — bring the timezone select in `chart/page.tsx` to parity with the full list used in `chat/page.tsx`
- [ ] **Dynamic exchange rate** — fetch live USD→INR rate from a free API (e.g., Frankfurter) instead of the hardcoded `83` constant
- [ ] **Subscription model** — add recurring monthly/annual plans alongside the current one-time passes; Razorpay supports subscriptions
- [ ] **Dasha timeline** — use VedAstro's Dasha API to display the user's planetary period timeline (Mahadasha / Antardasha) on the profile or a dedicated page

### P2 — UX & Product
- [ ] **Rename `proxy.ts` → `middleware.ts`** — align with Next.js convention
- [ ] **Consolidate `AiChatInput`** — either use it everywhere or delete it; eliminate the duplicated inline input implementations
- [ ] **Sidebar state via React context** — replace the `localStorage` + custom DOM event pattern with a proper context provider
- [ ] **Chat history persistence** — currently messages live only in component state; persist to MongoDB so sessions survive page refresh
- [ ] **Streaming abort on navigate** — cancel the SSE stream properly when the user navigates away mid-response
- [ ] **Onboarding flow polish** — multi-step wizard for birth data entry (date → time → location) instead of a single-page form
- [ ] **Transit alerts** — notify users (email or in-app) when significant Vedic transits (e.g., Saturn return, Jupiter transit) are approaching based on their birth chart
- [ ] **Progressive Web App (PWA)** — add a service worker and manifest so users can install the app on mobile and use voice offline-gracefully

### P3 — Platform & Infrastructure
- [ ] **Rate limiting on `/api/geocode`** — add a per-user or per-IP limiter (e.g., Upstash Redis) to comply with Nominatim's usage policy
- [ ] **VedAstro self-hosting or caching** — cache chart SVGs and predictions in MongoDB by birth params hash to reduce external API latency and dependency
- [ ] **Error boundaries** — add React error boundaries around the chart, chat, and voice pages to show graceful fallbacks instead of blank screens on API failure
- [ ] **Observability** — integrate Sentry (or similar) for error tracking and add structured logging to API routes
- [ ] **E2E tests** — add Playwright tests covering the payment flow, chat onboarding gate, and voice Pro-check redirect
- [ ] **Environment validation** — use `zod` to parse and validate all `process.env` vars at startup, failing fast instead of silently using `undefined`
- [ ] **Multi-language support** — i18n for Hindi and other Indic languages given the core Vedic astrology audience

---

## Monetization Summary

| Plan | Price | Voice Minutes | USD→INR |
|---|---|---|---|
| Starter Pass | $2 | 5 min | 83x (fixed) |
| Growth Pass | $5 | 15 min | 83x (fixed) |
| Pro Pass | $10 | 40 min | 83x (fixed) |

- Text chat is free up to 15 messages, then gated to paid users
- Voice is Pro-only; balance is decremented in real-time
- No recurring subscription yet (one-time passes only)
