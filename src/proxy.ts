import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/voice(.*)',
  '/chart(.*)',
  '/profile(.*)',
  '/admin(.*)',
  '/api/chat(.*)',
  '/api/chart(.*)',
  '/api/geocode(.*)',
  '/api/user(.*)',
  '/api/conversations(.*)',
  '/api/razorpay(.*)',
  '/api/verify-payment(.*)',
  '/api/realtime-session(.*)',
  '/api/admin(.*)',
]);

// Webhooks are called by Razorpay and Clerk, not by a signed-in browser, so
// they must never require a session. They authenticate themselves by verifying
// the signature over the raw request body inside each handler.
const isWebhookRoute = createRouteMatcher(['/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req)) return;
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
