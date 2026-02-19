'use client';

import { useActionState } from 'react';
import { authenticate } from '../../actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-warm/20">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-dark">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-dark/60">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-accent-earthy hover:text-text-dark transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form action={action} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state?.email || ''}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark rounded-t-md focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                placeholder="Email address"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark rounded-b-md focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                placeholder="Password"
              />
            </div>
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {state.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-neutral-light bg-text-dark hover:bg-accent-earthy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-earthy transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
