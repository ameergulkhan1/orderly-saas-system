"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset } from "@/lib/firebase";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      let message = "Failed to send reset link. Please try again.";

      if (code === "auth/user-not-found") {
        // Don't reveal whether the email exists — show success anyway
        setSent(true);
        setLoading(false);
        return;
      } else if (code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
      }

      setError(err?.message || message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/images/saaslogo.jpg"
                  alt="Orderly"
                  width={40}
                  height={40}
                  priority
                  className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-blue-200"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Orderly
                </span>
              </div>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Check your email</h3>
              <p className="mt-1 text-sm text-gray-600">
                We've sent a password reset link to
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 break-all">
                {email}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Didn't receive it? Check your spam folder or try again.
              </p>

              <div className="mt-6 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Try a different email
                </Button>
                <Link href="/login" className="block">
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-200"
                  >
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Log in
                </Link>
              </p>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Mail className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">We've got you covered</h2>
          <p className="mt-4 text-blue-100">
            Password recovery is quick and secure. Just enter your email and
            we'll take care of the rest.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="text-2xl font-bold">🔐</div>
              <div className="text-sm text-blue-100">Secure Reset</div>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="text-2xl font-bold">⚡</div>
              <div className="text-sm text-blue-100">Instant Email</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}