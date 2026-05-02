import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/chat',
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
  '/api/chat',
]);

// If Clerk keys are missing (common in local/dev previews),
// skip auth entirely to avoid dev-server proxy/socket errors.
const hasClerkKeys = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const middleware = hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
