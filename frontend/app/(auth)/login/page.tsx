"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/lib/api/auth.api";
import { signInWithGoogle } from "@/lib/firebase";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error?.message || "Invalid email or password");
      }
    } catch (err: any) {
      setError(
        err?.error?.message ||
          err?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // 1) Popup Google sign-in → get Firebase ID token
      const firebaseUser = await signInWithGoogle();

      // 2. Exchange the Firebase ID token for your backend JWT
      const res = await authAPI.googleLogin({
        idToken: firebaseUser.idToken,
      });

      if (!res.success) {
        setError(res.error?.message || "Google sign-in failed");
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      // User closed the popup or cancelled
      const code = err?.code as string | undefined;
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        setError("Google sign-in was cancelled.");
      } else if (code === "auth/account-exists-with-different-credential") {
        setError(
          "This email is registered with a different sign-in method. Use that one, or log in with email and password."
        );
      } else {
        setError(
          err?.error?.message ||
            err?.message ||
            "Google login failed. Please try again."
        );
      }
    } finally {
      setGoogleLoading(false);
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
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Login to manage your orders
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="relative w-full border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 h-11"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="font-medium">Continue with Google</span>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

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
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm" />
          </div>
          <h2 className="text-3xl font-bold">Manage Your Orders Effortlessly</h2>
          <p className="mt-4 text-blue-100">
            Join thousands of sellers who use Orderly to manage their WhatsApp and Instagram orders.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="text-2xl font-bold">200+</div>
              <div className="text-sm text-blue-100">Active Sellers</div>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-sm text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}