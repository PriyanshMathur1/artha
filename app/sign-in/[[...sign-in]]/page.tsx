import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-xl font-black text-white">
            A
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Sign in to Artha</h1>
          <p className="mt-1 text-sm text-slate-500">Your wealth management dashboard</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-none border border-slate-200 rounded-xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
            },
          }}
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
