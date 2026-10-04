import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import {
  ShieldCheckIcon,
  CheckIcon,
} from "../components/common/Icons";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateProfile(formData);
      setIsSaving(false);
      showToast("Profile information updated successfully!", "success");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-canvas py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Profile & Settings", href: "/profile" }]} />

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-line">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User"}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-line shadow-xs"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-2xl shadow-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                    {user?.name || "Community Member"}
                  </h1>
                  <Badge variant="verified" size="sm">
                    {user?.role === "admin" ? "Administrator" : "Verified Member"}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success" size="md">
                Account Status: Active
              </Badge>
            </div>
          </div>

          {/* Verification Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
            <div className="p-3 bg-brand-tint border border-brand-line rounded-xl flex items-center gap-2.5">
              <ShieldCheckIcon className="w-5 h-5 text-brand shrink-0" />
              <div>
                <strong className="text-brand-strong block">Identity Verified</strong>
                <span className="text-brand text-[11px]">Community Account Active</span>
              </div>
            </div>

            <div className="p-3 bg-brand-tint border border-brand-line rounded-xl flex items-center gap-2.5">
              <CheckIcon className="w-5 h-5 text-brand shrink-0" />
              <div>
                <strong className="text-brand-strong block">Contact Verified</strong>
                <span className="text-brand text-[11px]">
                  {user?.phone || "Phone provided"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-brand-tint border border-brand-line rounded-xl flex items-center gap-2.5">
              <CheckIcon className="w-5 h-5 text-brand shrink-0" />
              <div>
                <strong className="text-brand-strong block">Donor Eligibility</strong>
                <span className="text-brand text-[11px]">Eligible to List Surplus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-ink mb-6">
            Personal & Handover Details
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-alt border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || user?.email || ""}
                  disabled
                  className="w-full bg-slate-100 border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink-subtle cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-surface-alt border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Primary Community Pickup / Delivery Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Kothrud, Pune, Maharashtra"
                  className="w-full bg-surface-alt border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="shadow-xs"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}