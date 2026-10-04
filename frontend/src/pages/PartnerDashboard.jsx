import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import {
  ShieldCheckIcon,
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  MapPinIcon,
  CheckIcon,
} from "../components/common/Icons";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("available"); // 'available', 'handovers', 'history'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("nearby");

  const [availableDonations, setAvailableDonations] = useState([]);
  const [myAcceptedDonations, setMyAcceptedDonations] = useState([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [isLoadingAccepted, setIsLoadingAccepted] = useState(true);

  // Accept Donation Modal
  const [selectedForAccept, setSelectedForAccept] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Verify Handover Modal
  const [verifyingMed, setVerifyingMed] = useState(null);
  const [handoverCodeInput, setHandoverCodeInput] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const fetchAvailable = async () => {
    setIsLoadingAvailable(true);
    try {
      const res = await api.get("/medicines/partner/available", {
        params: {
          search: searchQuery.trim() || undefined,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          sort: sortBy,
        },
      });
      if (res.data?.success) {
        setAvailableDonations(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch partner available donations:", err.message);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const fetchAccepted = async () => {
    setIsLoadingAccepted(true);
    try {
      const res = await api.get("/medicines/partner/my-accepted");
      if (res.data?.success) {
        setMyAcceptedDonations(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch partner accepted donations:", err.message);
    } finally {
      setIsLoadingAccepted(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    api
      .get("/medicines/partner/available", {
        params: {
          search: searchQuery.trim() || undefined,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          sort: sortBy,
        },
      })
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setAvailableDonations(res.data.data || []);
          setIsLoadingAvailable(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAvailable(false);
      });

    api
      .get("/medicines/partner/my-accepted")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setMyAcceptedDonations(res.data.data || []);
          setIsLoadingAccepted(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAccepted(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, sortBy, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAvailable();
  };

  const handleAcceptDonation = async () => {
    if (!selectedForAccept) return;
    setIsAccepting(true);
    try {
      const res = await api.post(`/medicines/${selectedForAccept._id}/accept-donation`);
      if (res.data?.success) {
        showToast("Donation accepted! 6-digit physical handover code generated for donor.", "success");
        setSelectedForAccept(null);
        fetchAvailable();
        fetchAccepted();
        setActiveTab("handovers");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to accept donation", "error");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    if (!verifyingMed || !handoverCodeInput.trim()) {
      setVerificationError("Please enter the 6-digit physical handover code");
      return;
    }

    setIsVerifyingCode(true);
    setVerificationError("");

    try {
      const res = await api.post(`/medicines/${verifyingMed._id}/verify-handover`, {
        code: handoverCodeInput.trim(),
      });
      if (res.data?.success) {
        showToast("Physical handover verified & donation marked completed!", "success");
        setVerifyingMed(null);
        setHandoverCodeInput("");
        fetchAccepted();
        fetchAvailable();
        setActiveTab("history");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid handover code";
      setVerificationError(msg);
      showToast(msg, "error");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const activeHandovers = myAcceptedDonations.filter((m) => m.status === "accepted");
  const completedHandovers = myAcceptedDonations.filter((m) => m.status === "completed");

  // Reject / Release Donation Modal
  const [rejectingMed, setRejectingMed] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const getExpiryBadge = (expDate) => {
    if (!expDate) return null;
    const exp = new Date(expDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (exp <= today) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
          🔴 Expired — Disposal Only
        </span>
      );
    }

    const diffMonths = Math.round((exp - today) / (1000 * 60 * 60 * 24 * 30.44));

    if (diffMonths >= 6) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]">
          🟢 Stable ({diffMonths}m)
        </span>
      );
    } else if (diffMonths >= 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
          🟡 Expiring Soon ({diffMonths}m)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
          🔴 Critical (&lt;3m)
        </span>
      );
    }
  };

  const handleRejectDonation = async (e) => {
    e.preventDefault();
    if (!rejectingMed) return;
    setIsRejecting(true);
    try {
      const res = await api.post(`/medicines/${rejectingMed._id}/reject-donation`, {
        reason: rejectReason.trim() || "Unsuitable for partner redistribution upon inspection",
      });
      if (res.data?.success) {
        showToast("Donation released back to available pool.", "success");
        setRejectingMed(null);
        setRejectReason("");
        fetchAccepted();
        fetchAvailable();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to release donation", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] py-8 text-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Partner Portal", href: "/partner", current: true },
          ]}
        />

        {/* Partner Organization Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-[#e4e2dd] shadow-2xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f3f1] text-[#0f4c42] border border-[#a7f3d0]">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                  Verified Community Partner
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f2f1ec] text-[#525252]">
                  <MapPinIcon className="w-3 h-3 text-[#737373]" />
                  {user?.locality || "Katraj, Pune"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
                {user?.organizationName || "Partner Health Center & NGO Portal"}
              </h1>
              <p className="text-xs sm:text-sm text-[#525252] max-w-2xl">
                Welcome, <strong>{user?.name}</strong> ({user?.organizationType || "Charitable Health Organization"}). Review verified community medicine donations, accept available listings in your locality, and perform secure physical handovers via donor 6-digit OTP verification.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-[#fafaf7] p-3 rounded-xl border border-[#e4e2dd] text-center shrink-0">
              <div className="px-2">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">Available</p>
                <p className="text-xl font-extrabold text-[#0f4c42]">{availableDonations.length}</p>
              </div>
              <div className="px-2 border-x border-[#e4e2dd]">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">Active Handover</p>
                <p className="text-xl font-extrabold text-[#b45309]">{activeHandovers.length}</p>
              </div>
              <div className="px-2">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">Completed</p>
                <p className="text-xl font-extrabold text-[#15803d]">{completedHandovers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e4e2dd] gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "available"
                ? "bg-white border-t border-x border-[#e4e2dd] text-[#0f4c42] shadow-2xs"
                : "text-[#525252] hover:text-[#171717] hover:bg-[#f2f1ec]"
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            Available Community Donations ({availableDonations.length})
          </button>
          <button
            onClick={() => setActiveTab("handovers")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "handovers"
                ? "bg-white border-t border-x border-[#e4e2dd] text-[#b45309] shadow-2xs"
                : "text-[#525252] hover:text-[#171717] hover:bg-[#f2f1ec]"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            Active Physical Handovers ({activeHandovers.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-white border-t border-x border-[#e4e2dd] text-[#15803d] shadow-2xs"
                : "text-[#525252] hover:text-[#171717] hover:bg-[#f2f1ec]"
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Redistribution History ({completedHandovers.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE DONATIONS */}
        {activeTab === "available" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-[#e4e2dd] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
                <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search medicine name, salts, manufacturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f7f7f4] border border-[#e4e2dd] text-xs rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                />
              </form>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#f7f7f4] border border-[#e4e2dd] text-xs rounded-lg px-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                >
                  <option value="All">All Categories</option>
                  <option value="Pain & Fever">Pain & Fever</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                  <option value="Cardiovascular & BP">Cardiovascular & BP</option>
                  <option value="Diabetes Care">Diabetes Care</option>
                  <option value="Respiratory & Allergy">Respiratory & Allergy</option>
                  <option value="Gastrointestinal">Gastrointestinal</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#f7f7f4] border border-[#e4e2dd] text-xs rounded-lg px-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                >
                  <option value="nearby">📍 Closest Proximity First</option>
                  <option value="expiry-nearest">⏳ Nearest Expiry First</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {isLoadingAvailable ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white p-5 rounded-xl border border-[#e4e2dd] animate-pulse space-y-3">
                    <div className="h-4 bg-[#f2f1ec] rounded w-3/4"></div>
                    <div className="h-3 bg-[#f2f1ec] rounded w-1/2"></div>
                    <div className="h-20 bg-[#f2f1ec] rounded"></div>
                  </div>
                ))}
              </div>
            ) : availableDonations.length === 0 ? (
              <EmptyState
                icon={PackageIcon}
                title="No Available Donations Found"
                description="There are currently no verified community donations waiting in this category or locality. Check back soon!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableDonations.map((med) => {
                  const dist = med.proximity?.distanceKm;
                  return (
                    <div
                      key={med._id}
                      className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f3f1] text-[#0f4c42] uppercase tracking-wider mb-1">
                              {med.category}
                            </span>
                            <h3 className="text-base font-bold text-[#171717] leading-snug">
                              {med.medicineName}
                            </h3>
                            <p className="text-xs text-[#525252]">
                              {med.company} {med.strength ? `· ${med.strength}` : ""}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-1 rounded-lg text-xs font-extrabold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                              🎁 Free Donation
                            </span>
                          </div>
                        </div>

                        {/* Details pill box */}
                        <div className="bg-[#fafaf7] p-3 rounded-lg border border-[#e4e2dd] text-xs space-y-1.5">
                          <div className="flex justify-between text-[#525252]">
                            <span>Batch Number:</span>
                            <span className="font-semibold text-[#171717]">{med.batchNumber || "Verified"}</span>
                          </div>
                          <div className="flex justify-between text-[#525252]">
                            <span>Quantity:</span>
                            <span className="font-semibold text-[#171717]">{med.quantity} {med.unit || "units"}</span>
                          </div>
                          <div className="flex justify-between text-[#525252]">
                            <span>Packaging:</span>
                            <span className="font-medium text-[#171717] truncate max-w-[170px]">{med.packageCondition}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-[#e4e2dd]">
                            <span>Expiry:</span>
                            {getExpiryBadge(med.expiryDate)}
                          </div>
                        </div>

                        {/* Location and straight-line distance */}
                        <div className="text-xs text-[#525252] space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-[#171717]">
                            <MapPinIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                            {med.locality || "Pune"} ({med.pinCode || "411046"})
                          </div>
                          {dist !== undefined && dist !== null && (
                            <p className="text-[11px] text-[#737373] italic">
                              Approx. straight-line distance: ~{dist.toFixed(1)} km from your center
                            </p>
                          )}
                          <p className="text-[11px] text-[#525252]">
                            <strong>Handover point:</strong> {med.handoverPoint || "Community landmark"}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 border-t border-[#e4e2dd] mt-4">
                        <Button
                          variant="primary"
                          className="w-full justify-center text-xs py-2 bg-[#0f4c42] hover:bg-[#0a362f]"
                          onClick={() => setSelectedForAccept(med)}
                        >
                          🤝 Accept Donation for Redistribution
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE PHYSICAL HANDOVERS */}
        {activeTab === "handovers" && (
          <div className="space-y-4">
            <div className="bg-[#fffbeb] p-4 rounded-xl border border-[#fef3c7] text-xs text-[#92400e] flex items-start gap-3 shadow-2xs">
              <ClockIcon className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#78350f]">Physical Medicine Handover Verification Instructions</p>
                <p className="mt-1 text-[#92400e]">
                  These medicine donations have been assigned to your organization. During physical handover with the donor, inspect packaging integrity and ask the donor for their <strong>6-digit secure handover code</strong> shown in their member dashboard. Enter and verify the code below to complete redistribution.
                </p>
              </div>
            </div>

            {isLoadingAccepted ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white p-5 rounded-xl border border-[#e4e2dd] animate-pulse h-28"></div>
                ))}
              </div>
            ) : activeHandovers.length === 0 ? (
              <EmptyState
                icon={ClockIcon}
                title="No Active Handovers"
                description="You have not accepted any pending donations yet. Switch to 'Available Community Donations' to review and accept medicines."
                actionLabel="Browse Available Donations"
                onAction={() => setActiveTab("available")}
              />
            ) : (
              <div className="space-y-4">
                {activeHandovers.map((med) => (
                  <div
                    key={med._id}
                    className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e] uppercase tracking-wider">
                          Awaiting Physical Handover
                        </span>
                        {getExpiryBadge(med.expiryDate)}
                      </div>

                      <h3 className="text-base font-bold text-[#171717]">
                        {med.medicineName} ({med.quantity} {med.unit || "units"})
                      </h3>

                      <div className="text-xs text-[#525252] space-y-1">
                        <p>
                          <strong>Manufacturer:</strong> {med.company} · <strong>Batch:</strong> {med.batchNumber || "Verified"}
                        </p>
                        <p>
                          <strong>Donor Name:</strong> {med.seller?.name || "Community Donor"} ({med.seller?.phone || "Contact upon handover"})
                        </p>
                        <p>
                          <strong>Handover Point:</strong> {med.handoverPoint || med.locality || "Katraj"}
                        </p>
                      </div>

                      {med.handoverLocked && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fee2e2] text-[#991b1b] text-xs font-bold">
                          <AlertTriangleIcon className="w-4 h-4" />
                          Handover locked due to 5 consecutive failed attempts. Please contact Admin.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Button
                        variant="outline"
                        className="text-xs py-2 px-3 text-[#be123c] border-[#fecdd3] hover:bg-[#fff1f2]"
                        onClick={() => {
                          setRejectingMed(med);
                          setRejectReason("");
                        }}
                      >
                        Cancel / Release
                      </Button>
                      <Button
                        variant="primary"
                        className="bg-[#b45309] hover:bg-[#92400e] text-xs py-2 px-4 flex items-center justify-center gap-2"
                        onClick={() => {
                          setVerifyingMed(med);
                          setHandoverCodeInput("");
                          setVerificationError("");
                        }}
                        disabled={med.handoverLocked}
                      >
                        <CheckIcon className="w-4 h-4" />
                        Enter 6-Digit Handover Code
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REDISTRIBUTION HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {isLoadingAccepted ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white p-5 rounded-xl border border-[#e4e2dd] animate-pulse h-20"></div>
                ))}
              </div>
            ) : completedHandovers.length === 0 ? (
              <EmptyState
                icon={CheckCircleIcon}
                title="No Completed Handovers Yet"
                description="Once you verify physical handover codes with donors, the verified redistribution audit trail will appear here."
              />
            ) : (
              <div className="bg-white rounded-xl border border-[#e4e2dd] shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e4e2dd] bg-[#fafaf7] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#171717]">
                    Verified Physical Handover Audit Trail ({completedHandovers.length})
                  </h3>
                  <span className="text-xs text-[#525252]">
                    Total Units Rescued: <strong>{completedHandovers.reduce((acc, curr) => acc + (curr.quantity || 0), 0)}</strong>
                  </span>
                </div>

                <div className="divide-y divide-[#e4e2dd]">
                  {completedHandovers.map((med) => (
                    <div key={med._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                            <CheckIcon className="w-3 h-3 text-[#15803d]" />
                            Handover Verified
                          </span>
                          <span className="text-xs text-[#737373]">
                            Completed on: {med.completedAt ? new Date(med.completedAt).toLocaleString() : "Recently"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#171717]">
                          {med.medicineName} ({med.quantity} {med.unit || "units"})
                        </h4>
                        <p className="text-xs text-[#525252]">
                          Batch: {med.batchNumber || "Verified"} · Donor: {med.seller?.name || "Community Donor"} ({med.locality || "Katraj"})
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="inline-block text-xs font-semibold text-[#0f4c42] bg-[#e8f3f1] px-3 py-1 rounded-full border border-[#a7f3d0]">
                          Redistributed to Community
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: ACCEPT DONATION CONFIRMATION */}
        {selectedForAccept && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedForAccept(null)}
            title="Accept Community Donation"
          >
            <div className="space-y-4 text-xs text-[#262626]">
              <p>
                You are accepting the following medicine donation on behalf of <strong>{user?.organizationName || "your partner center"}</strong>:
              </p>

              <div className="bg-[#f7f7f4] p-3.5 rounded-xl border border-[#e4e2dd] space-y-1.5">
                <p className="font-bold text-sm text-[#171717]">{selectedForAccept.medicineName}</p>
                <p><strong>Quantity:</strong> {selectedForAccept.quantity} {selectedForAccept.unit || "units"}</p>
                <p><strong>Batch:</strong> {selectedForAccept.batchNumber || "Standard batch"}</p>
                <p><strong>Expiry:</strong> {new Date(selectedForAccept.expiryDate).toLocaleDateString()}</p>
                <p><strong>Handover Landmark:</strong> {selectedForAccept.handoverPoint || selectedForAccept.locality}</p>
              </div>

              <div className="bg-[#e8f3f1] p-3 rounded-lg border border-[#a7f3d0] text-[#0f4c42]">
                <p className="font-bold">Next Steps:</p>
                <p className="mt-0.5">
                  Upon acceptance, a unique 6-digit physical handover code will be generated and made visible ONLY to the donor in their dashboard. You will collect this code during in-person medicine collection.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e4e2dd]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedForAccept(null)}
                  disabled={isAccepting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAcceptDonation}
                  disabled={isAccepting}
                  className="bg-[#0f4c42] hover:bg-[#0a362f]"
                >
                  {isAccepting ? "Accepting..." : "Confirm & Accept Donation"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 2: VERIFY 6-DIGIT HANDOVER CODE */}
        {verifyingMed && (
          <Modal
            isOpen={true}
            onClose={() => {
              setVerifyingMed(null);
              setHandoverCodeInput("");
              setVerificationError("");
            }}
            title="Physical Handover Verification"
          >
            <form onSubmit={handleVerifyHandover} className="space-y-4 text-xs text-[#262626]">
              <p>
                Please verify physical inspection of <strong>{verifyingMed.medicineName}</strong> (Batch: {verifyingMed.batchNumber || "Verified"}) and enter the 6-digit handover code provided by donor <strong>{verifyingMed.seller?.name || "Community Donor"}</strong>:
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#171717]">
                  6-Digit Handover Code (OTP):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 548921"
                  value={handoverCodeInput}
                  onChange={(e) => setHandoverCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono tracking-widest bg-[#f7f7f4] border-2 border-[#0f4c42] rounded-xl py-3 focus:outline-none focus:bg-white transition"
                  autoFocus
                />
              </div>

              {verificationError && (
                <div className="p-3 bg-[#fee2e2] text-[#991b1b] rounded-lg border border-[#fecaca] font-medium">
                  {verificationError}
                </div>
              )}

              <p className="text-[11px] text-[#737373]">
                * Security policy enforces maximum 5 attempts before verification lockout.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e4e2dd]">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setVerifyingMed(null);
                    setHandoverCodeInput("");
                    setVerificationError("");
                  }}
                  disabled={isVerifyingCode}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isVerifyingCode || handoverCodeInput.length < 6}
                  className="bg-[#0f4c42] hover:bg-[#0a362f]"
                >
                  {isVerifyingCode ? "Verifying..." : "Verify & Complete Handover"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 3: REJECT / RELEASE DONATION */}
        {rejectingMed && (
          <Modal
            isOpen={true}
            onClose={() => {
              setRejectingMed(null);
              setRejectReason("");
            }}
            title="Cancel / Release Donation"
          >
            <form onSubmit={handleRejectDonation} className="space-y-4 text-xs text-[#262626]">
              <p>
                Are you sure you want to release <strong>{rejectingMed.medicineName}</strong> back to the available donations pool?
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#171717]">
                  Reason for Cancellation / Rejection:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Damaged packaging upon inspection, donor unreachable, or unable to collect."
                  className="w-full bg-[#f7f7f4] border border-[#e4e2dd] rounded-lg p-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e4e2dd]">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setRejectingMed(null);
                    setRejectReason("");
                  }}
                  disabled={isRejecting}
                >
                  Keep Handover
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isRejecting || !rejectReason.trim()}
                  className="bg-[#be123c] hover:bg-[#9f1239] text-white"
                >
                  {isRejecting ? "Releasing..." : "Confirm Release"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
