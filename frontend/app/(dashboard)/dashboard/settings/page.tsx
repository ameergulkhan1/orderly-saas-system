"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Building2,
  Users,
  Bell,
  MessageSquare,
  CreditCard,
  Shield,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { authAPI } from "@/lib/api/auth.api";
import { businessAPI } from "@/lib/api/business.api";
import { usersAPI } from "@/lib/api/users.api";
import type { User, Business, UserStatus } from "@/lib/api/types";

type TabType =
  | "general"
  | "business"
  | "team"
  | "notifications"
  | "whatsapp"
  | "billing"
  | "security";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) ?? "general";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Keep URL in sync when tab changes (nice for back/forward nav)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url.toString());
  }, [activeTab]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
    { id: "business", label: "Business", icon: <Building2 className="h-4 w-4" /> },
    { id: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
    { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "business":
        return <BusinessSettings />;
      case "team":
        return <TeamSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "whatsapp":
        return <WhatsAppSettings />;
      case "billing":
        return <BillingSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">
          Manage your account and business settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// General Settings
// ============================================
function GeneralSettings() {
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
  });
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authAPI.me();

        if (res.success && res.data) {
          const me: any = res.data;
          setBusinessId(me.business?.id ?? me.businessId ?? null);
          setFormData({
            businessName: me.business?.name ?? "",
            ownerName: me.name ?? "",
            phone: me.business?.phone ?? "",
            email: me.email ?? me.business?.email ?? "",
          });
        } else {
          setError(res.error?.message || "Failed to load profile");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!businessId) {
      setError("Business ID not found");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await businessAPI.update(businessId, {
        name: formData.businessName,
        phone: formData.phone,
        email: formData.email || undefined,
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to save settings");
        return;
      }
      alert("Settings saved successfully!");
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            className="mt-1"
            value={formData.businessName}
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input
            id="ownerName"
            className="mt-1"
            value={formData.ownerName}
            onChange={(e) =>
              setFormData({ ...formData, ownerName: e.target.value })
            }
            disabled
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            className="mt-1"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            className="mt-1"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Business Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Logo
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Business Settings
// ============================================
function BusinessSettings() {
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    country: "Pakistan",
    postalCode: "",
    website: "",
    category: "Clothing",
  });
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const bizRes = await businessAPI.get();

        if (!bizRes.success || !bizRes.data) {
          setError(bizRes.error?.message || "Failed to load business info");
          return;
        }

        const b: Business & any = bizRes.data;
        setBusinessId(b.id);
        setFormData({
          address: b.address ?? "",
          city: b.city ?? "",
          state: b.state ?? "",
          country: b.country ?? "Pakistan",
          postalCode: b.postalCode ?? "",
          website: b.website ?? "",
          category: b.category ?? "Clothing",
        });
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load business info"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!businessId) {
      setError("Business ID not found");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await businessAPI.update(businessId, {
        address: formData.address,
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to save business info");
        return;
      }
      alert("Business info saved!");
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to save business info"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Business Address</Label>
          <Input
            id="address"
            className="mt-1"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              className="mt-1"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              className="mt-1"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              className="mt-1"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              className="mt-1"
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            className="mt-1"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="category">Business Category</Label>
          <select
            id="category"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="Clothing">Clothing</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Food">Food</option>
            <option value="Electronics">Electronics</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="border-t pt-4">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Team Settings
// ============================================
function TeamSettings() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await usersAPI.list();

        if (res.success && Array.isArray(res.data)) {
          setTeamMembers(res.data);
        } else {
          setError(res.error?.message || "Failed to load team members");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load team members"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleStatus = async (member: User) => {
    const nextStatus: UserStatus =
      member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      const res = await usersAPI.updateStatus(member.id, nextStatus);
      if (!res.success) {
        alert(res.error?.message || "Failed to update status");
        return;
      }
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
      );
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    try {
      const res = await usersAPI.delete(id);
      if (!res.success) {
        alert(res.error?.message || "Failed to remove member");
        return;
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to remove member");
    }
  };

  const roleColors: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-700",
    ADMIN: "bg-blue-100 text-blue-700",
    STAFF: "bg-gray-100 text-gray-700",
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <Link href="/dashboard/settings/team/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : teamMembers.length === 0 ? (
        <p className="text-sm text-gray-500">No team members yet</p>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                  {initials(member.name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  className={`${roleColors[member.role] ?? "bg-gray-100 text-gray-700"} border-0`}
                >
                  {member.role}
                </Badge>
                <button
                  onClick={() => handleToggleStatus(member)}
                  className={`flex items-center gap-1 text-sm ${
                    member.status === "ACTIVE"
                      ? "text-green-600"
                      : member.status === "SUSPENDED"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  <CheckCircle className="h-3 w-3" />
                  {member.status}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-red-50"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Notification Settings
// ============================================
function NotificationSettings() {
  const [notifications, setNotifications] = useState([
    { id: 1, label: "New Order", description: "Get notified when a new order is placed", enabled: true },
    { id: 2, label: "Payment Received", description: "Get notified when a payment is received", enabled: true },
    { id: 3, label: "Low Stock Alert", description: "Get notified when stock is running low", enabled: true },
    { id: 4, label: "Delivery Updates", description: "Get notified about delivery status changes", enabled: false },
    { id: 5, label: "Customer Messages", description: "Get notified when a customer messages", enabled: true },
    { id: 6, label: "System Updates", description: "Get notified about system updates and maintenance", enabled: false },
  ]);

  const toggleNotification = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <button
              onClick={() => toggleNotification(item.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.enabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// WhatsApp Settings
// ============================================
function WhatsAppSettings() {
  const [settings, setSettings] = useState({
    number: "",
    autoReply: true,
    orderConfirmation: true,
    shippingNotification: true,
    deliveryNotification: true,
    paymentReminder: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      alert("WhatsApp settings saved!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>

      <div>
        <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
        <Input
          id="whatsappNumber"
          className="mt-1"
          value={settings.number}
          onChange={(e) => setSettings({ ...settings, number: e.target.value })}
        />
        <p className="mt-1 text-sm text-gray-500">
          This number will be used for customer communication
        </p>
      </div>

      <div className="space-y-3">
        {[
          { key: "autoReply", label: "Auto Reply", desc: "Automatically reply to customer messages" },
          { key: "orderConfirmation", label: "Order Confirmation", desc: "Send order confirmation via WhatsApp" },
          { key: "shippingNotification", label: "Shipping Notification", desc: "Send shipping updates via WhatsApp" },
          { key: "deliveryNotification", label: "Delivery Notification", desc: "Send delivery confirmation via WhatsApp" },
          { key: "paymentReminder", label: "Payment Reminder", desc: "Send payment reminders via WhatsApp" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  [item.key]: !(settings as any)[item.key],
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (settings as any)[item.key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (settings as any)[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Billing Settings
// ============================================
function BillingSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Billing & Subscription</h2>
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900">Business</p>
            <p className="text-sm text-gray-600">Rs. 1,999/month</p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline">Upgrade Plan</Button>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
            Cancel Subscription
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="font-medium text-gray-900">Payment Method</h3>
        <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 p-4">
          <CreditCard className="h-6 w-6 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
            <p className="text-sm text-gray-500">Expires 12/2026</p>
          </div>
          <Button variant="ghost" className="ml-auto text-blue-600">
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Security Settings
// ============================================
function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    setError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to update password");
        return;
      }

      alert("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to update password"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Security</h2>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative mt-1">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              className="pr-10"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            className="mt-1"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            className="mt-1"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
          />
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            🔒 Password must be at least 8 characters long and include a number and special character.
          </p>
        </div>
      </div>

      <div className="border-t pt-4 flex gap-4">
        <Button
          onClick={handleUpdatePassword}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          disabled={saving}
        >
          {saving ? "Updating..." : "Update Password"}
        </Button>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
          onClick={async () => {
            if (!confirm("Log out from all devices?")) return;
            try {
              await authAPI.logout();
              window.location.href = "/login";
            } catch {
              alert("Failed to log out");
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out All Devices
        </Button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h4 className="font-medium text-red-800">Danger Zone</h4>
        <p className="text-sm text-red-700">
          Permanently delete your account and all data.
        </p>
        <Button variant="destructive" className="mt-2 bg-red-600 hover:bg-red-700">
          Delete Account
        </Button>
      </div>
    </div>
  );
}