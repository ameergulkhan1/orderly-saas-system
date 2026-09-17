"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usersAPI } from "@/lib/api/users.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  UserPlus,
  Loader2,
} from "lucide-react";

type UserRole = "ADMIN" | "STAFF";

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await usersAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to create user");
        return;
      }

      router.push("/dashboard/settings?tab=team");
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings?tab=team"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Team
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Team Member</h1>
        <p className="text-sm text-gray-600">
          Create a new account for a team member to access your dashboard
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="name">Full Name *</Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ali Raza"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="ali@yourcompany.com"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Temporary Password *</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Min. 8 characters"
              className="pl-10 pr-10 h-11"
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Share this with the team member — they can change it after login.
          </p>
        </div>

        <div>
          <Label>Role *</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["STAFF", "ADMIN"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all ${
                  formData.role === role
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield
                    className={`h-4 w-4 ${formData.role === role ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <span className="font-medium text-gray-900">{role}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {role === "ADMIN"
                    ? "Full access except billing & team creation"
                    : "Limited access — orders, products, customers"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-5 flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Team Member
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/settings?tab=team")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}