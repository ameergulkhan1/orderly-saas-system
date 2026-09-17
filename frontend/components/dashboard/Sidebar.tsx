"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  CreditCard,
  Truck,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authAPI } from "@/lib/api/auth.api";

const mainMenu = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "Orders", href: "/dashboard/orders" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Package, label: "Products", href: "/dashboard/products" },
  { icon: Boxes, label: "Inventory", href: "/dashboard/inventory" },
];

const businessMenu = [
  { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
  { icon: Truck, label: "Deliveries", href: "/dashboard/deliveries" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
];

const bottomMenu = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Sync internal state with prop
  useEffect(() => {
    if (isMobileOpen !== undefined) {
      setIsOpen(isMobileOpen);
    }
  }, [isMobileOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClose = () => {
    if (isMobile) {
      setIsOpen(false);
      onMobileClose?.();
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4 md:px-6">
        <Image
          src="/images/saaslogo.jpg"
          alt="Orderly"
          width={32}
          height={32}
          priority
          className="h-8 w-8 rounded-lg object-cover"
        />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Orderly
        </span>
        {isMobile && (
          <button
            onClick={handleClose}
            className="ml-auto rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 md:px-3">
        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main
          </p>
          <ul className="space-y-1">
            {mainMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4", isActive ? "text-blue-600" : "")}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Business
          </p>
          <ul className="space-y-1">
            {businessMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4", isActive ? "text-blue-600" : "")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t pt-4">
          <ul className="space-y-1">
            {bottomMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4", isActive ? "text-blue-600" : "")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t p-3 md:p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-2 md:p-3">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm md:text-base">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Ayesha Khan
            </p>
            <p className="text-xs text-gray-500 truncate">Ayesha Collection</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Desktop sidebar - always visible
  if (!isMobile) {
    return (
      <aside className="hidden w-[260px] flex-col border-r bg-white shadow-sm md:flex">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile - drawer overlay
  return (
    <>
      {/* Mobile Menu Button - Bottom right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white shadow-lg md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={handleClose}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    </>
  );
}