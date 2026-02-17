"use client";

import { useActionState } from "react";
import { register } from "../../actions/auth";
import Link from "next/link";

export default function RegisterPage() {
    const [state, action, isPending] = useActionState(register, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-light px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-warm/20">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-dark">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-text-dark/60">
                        Or{" "}
                        <Link href="/login" className="font-medium text-accent-earthy hover:text-text-dark transition-colors">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>
                <form action={action} className="mt-8 space-y-6">
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark rounded-t-md focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                                placeholder="Email address"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="sr-only">Password</label>
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
                        <div className="mb-4">
                            <label htmlFor="role" className="sr-only">Role</label>
                            <select
                                id="role"
                                name="role"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-neutral-warm/30 text-text-dark focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-white"
                                defaultValue="peserta"
                            >
                                <option value="peserta">Peserta</option>
                                <option value="pembina">Pembina</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="school" className="sr-only">School (Peserta/Pembina)</label>
                            <input
                                id="school"
                                name="school"
                                type="text"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                                placeholder="School Name"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="contact" className="sr-only">Contact Number</label>
                            <input
                                id="contact"
                                name="contact"
                                type="text"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                                placeholder="Contact Number (WhatsApp)"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="competitionCategory" className="sr-only">Competition Category</label>
                            <input
                                id="competitionCategory"
                                name="competitionCategory"
                                type="text"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-neutral-warm/30 placeholder-text-dark/40 text-text-dark focus:outline-none focus:ring-accent-earthy focus:border-accent-earthy focus:z-10 sm:text-sm bg-neutral-light/20"
                                placeholder="Competition Category (e.g. Kebumian)"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-md border border-green-100">
                            {state.success}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-neutral-light bg-accent-earthy hover:bg-text-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-earthy transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? "Creating account..." : "Sign up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
