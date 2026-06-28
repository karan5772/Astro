import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/voice(.*)',
  '/chart(.*)',
  '/profile(.*)',
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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
