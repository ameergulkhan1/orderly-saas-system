"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, HelpCircle, ChevronDown, Menu, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authAPI } from "@/lib/api/auth.api";
import type { User, Business } from "@/lib/api/types";

interface HeaderProps {
  onMenuClick?: () => void;
}

function initialsFrom(name?: string): string {
  if (!name) return "??";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Responsive
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load user
  useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.me();
        if (res.success && res.data) {
          const me: any = res.data;
          setUser({
            id: me.id,
            name: me.name,
            email: me.email,
            role: me.role,
            status: me.status,
            businessId: me.businessId ?? me.business?.id ?? "",
            createdAt: me.createdAt ?? "",
          } as User);
          if (me.business) setBusiness(me.business);
        }
      } catch {
        /* silent */
      }
    };
    load();
  }, []);

  // ⌘K / Ctrl+K → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    if (!confirm("Log out of Orderly?")) return;
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch {
      /* authAPI.logout clears tokens in finally */
    } finally {
      router.replace("/login");
    }
  };

  const displayName = user?.name?.split(" ")[0] ?? "User";
  const initials = initialsFrom(user?.name);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-3 shadow-sm sm:px-6">
      {/* Left — mobile menu + search */}
      <div className="flex flex-1 items-center gap-2">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        )}

        <form
          onSubmit={handleSearch}
          className="relative hidden flex-1 max-w-md sm:block"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, products..."
            className="w-full pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500 lg:block">
            ⌘K
          </kbd>
        </form>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-1 sm:gap-3">
        {isMobile && (
          <button
            onClick={() => router.push("/dashboard/search")}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full hover:bg-gray-100 sm:flex"
        >
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </Button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 border-l pl-2 sm:pl-3 hover:opacity-90 transition-opacity"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium sm:text-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase() ?? "—"}
              </p>
            </div>
            <ChevronDown
              className={`h-3 w-3 text-gray-400 sm:h-4 sm:w-4 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-white p-1 shadow-lg"
            >
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name ?? "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email ?? ""}
                </p>
                {business?.name && (
                  <p className="mt-0.5 text-xs text-gray-400 truncate">
                    {business.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                role="menuitem"
                className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}