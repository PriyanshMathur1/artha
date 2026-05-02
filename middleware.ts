import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/stock/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/manifest.json',
  '/sw.js',
  '/api/screener',
  '/api/search',
  '/api/nse-search',
  '/api/signals',
  '/api/analyze/(.*)',
  '/api/history/(.*)',
  '/api/fundamentals/(.*)',
  '/api/news/ticker',
  '/api/quote/(.*)',   // allow public quote lookups for screener preview
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
