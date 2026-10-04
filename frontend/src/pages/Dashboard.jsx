import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import {
  PackageIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  FileTextIcon,
  UploadIcon,
} from "../components/common/Icons";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const currentUser = user || {
    name: "Community Member",
    email: "member@medisave.org",
    address: "Pune, Maharashtra",
    role: "user",
    avatar: "",
  };

  const initialTab = searchParams.get("tab") || "cabinet";
  const [activeTab, setActiveTab] = useState(initialTab); // 'cabinet', 'listings', 'seller-orders', 'orders', 'prescriptions'
  const [listingFilter, setListingFilter] = useState("all");

  // Medicine Cabinet State with Expiry Calculation
  const [cabinetItems, setCabinetItems] = useState(() => {
    try {
      const saved = localStorage.getItem("medisave_cabinet_items");
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    const today = new Date();
    const addDays = (d) => {
      const target = new Date(today.getTime() + d * 86400000);
      return target.toISOString().split("T")[0];
    };

    return [
      {
        id: "cab-1",
        name: "Dolo 650 (Paracetamol)",
        quantity: 15,
        unit: "tablets",
        expiryDate: addDays(240), // >6 months: Green
        category: "Pain & Fever",
        form: "Tablet",
      },
      {
        id: "cab-2",
        name: "Cetirizine 10mg",
        quantity: 10,
        unit: "tablets",
        expiryDate: addDays(120), // 3-6 months: Amber
        category: "Allergy & Cold",
        form: "Tablet",
      },
      {
        id: "cab-3",
        name: "Amoxicillin 500mg",
        quantity: 6,
        unit: "capsules",
        expiryDate: addDays(40), // <3 months: Red
        category: "Antibiotics",
        form: "Capsule",
      },
    ];
  });

  const [isAddCabinetModalOpen, setIsAddCabinetModalOpen] = useState(false);
  const [cabinetFormData, setCabinetFormData] = useState({
    name: "",
    quantity: 10,
    unit: "tablets",
    expiryDate: "",
    category: "General Health",
    form: "Tablet",
  });

  useEffect(() => {
    try {
      localStorage.setItem("medisave_cabinet_items", JSON.stringify(cabinetItems));
    } catch {
      // Ignore storage errors
    }
  }, [cabinetItems]);

  const getCabinetItemStatus = (expiryDateStr) => {
    if (!expiryDateStr) {
      return {
        tier: "critical",
        label: "No Date / Expired",
        color: "red",
        daysLeft: 0,
        eligible: false,
      };
    }
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        tier: "expired",
        label: `Expired (${Math.abs(diffDays)}d ago)`,
        color: "red",
        daysLeft: diffDays,
        eligible: false,
      };
    }
    if (diffDays < 90) {
      return {
        tier: "critical",
        label: `Less than 3 months (${diffDays}d left)`,
        color: "red",
        daysLeft: diffDays,
        eligible: false,
      };
    }
    if (diffDays <= 180) {
      return {
        tier: "warning",
        label: `3–6 months (${diffDays}d left)`,
        color: "amber",
        daysLeft: diffDays,
        eligible: true,
      };
    }
    return {
      tier: "healthy",
      label: `More than 6 months (${diffDays}d left)`,
      color: "green",
      daysLeft: diffDays,
      eligible: true,
    };
  };

  const handleAddCabinetSubmit = (e) => {
    e.preventDefault();
    if (!cabinetFormData.name.trim()) {
      showToast("Please enter medicine name", "error");
      return;
    }
    if (!cabinetFormData.expiryDate) {
      showToast("Please select expiry date", "error");
      return;
    }

    const newItem = {
      id: `cab-${Date.now()}`,
      name: cabinetFormData.name.trim(),
      quantity: Number(cabinetFormData.quantity) || 1,
      unit: cabinetFormData.unit || "tablets",
      expiryDate: cabinetFormData.expiryDate,
      category: cabinetFormData.category || "General Health",
      form: cabinetFormData.form || "Tablet",
    };

    setCabinetItems((prev) => [newItem, ...prev]);
    showToast(`Added "${newItem.name}" to Medicine Cabinet`, "success");
    setIsAddCabinetModalOpen(false);
    setCabinetFormData({
      name: "",
      quantity: 10,
      unit: "tablets",
      expiryDate: "",
      category: "General Health",
      form: "Tablet",
    });
  };

  const handleDeleteCabinetItem = (id, medName) => {
    setCabinetItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed "${medName}" from Cabinet`, "info");
  };

  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingSellerOrders, setIsLoadingSellerOrders] = useState(true);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(true);

  const [deletingId, setDeletingId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [updatingStatusKey, setUpdatingStatusKey] = useState(null);

  // Upload Prescription Modal State
  const [isUploadRxModalOpen, setIsUploadRxModalOpen] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [rxFormData, setRxFormData] = useState({
    patientName: "",
    doctorName: "",
    doctorRegistrationNumber: "",
    prescribedSalts: "",
  });
  const [rxFile, setRxFile] = useState(null);

  // Prescription Document Preview Modal State
  const [previewRx, setPreviewRx] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  const fetchListings = () => {
    setIsLoadingListings(true);
    api
      .get("/medicines/my-listings")
      .then((res) => {
        if (res.data?.success) {
          setListings(res.data.data || []);
        }
        setIsLoadingListings(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch user listings:", err.message);
        setIsLoadingListings(false);
      });
  };

  const fetchOrders = () => {
    setIsLoadingOrders(true);
    api
      .get("/orders/my-orders")
      .then((res) => {
        if (res.data?.success) {
          setOrders(res.data.data || []);
        }
        setIsLoadingOrders(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch user orders:", err.message);
        setIsLoadingOrders(false);
      });
  };

  const fetchSellerOrders = () => {
    setIsLoadingSellerOrders(true);
    api
      .get("/orders/seller-orders")
      .then((res) => {
        if (res.data?.success) {
          setSellerOrders(res.data.data || []);
        }
        setIsLoadingSellerOrders(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch seller orders:", err.message);
        setIsLoadingSellerOrders(false);
      });
  };

  const fetchPrescriptions = () => {
    setIsLoadingPrescriptions(true);
    api
      .get("/prescriptions/my-prescriptions")
      .then((res) => {
        if (res.data?.success) {
          setPrescriptions(res.data.data || []);
        }
        setIsLoadingPrescriptions(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch prescriptions:", err.message);
        setIsLoadingPrescriptions(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    api
      .get("/medicines/my-listings")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setListings(res.data.data || []);
          setIsLoadingListings(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingListings(false);
      });

    api
      .get("/orders/my-orders")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setOrders(res.data.data || []);
          setIsLoadingOrders(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingOrders(false);
      });

    api
      .get("/orders/seller-orders")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setSellerOrders(res.data.data || []);
          setIsLoadingSellerOrders(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingSellerOrders(false);
      });

    api
      .get("/prescriptions/my-prescriptions")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setPrescriptions(res.data.data || []);
          setIsLoadingPrescriptions(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPrescriptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteListing = async (medId, medTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${medTitle}" from your listings?`)) {
      return;
    }

    setDeletingId(medId);
    try {
      const res = await api.delete(`/medicines/${medId}`);
      if (res.data?.success) {
        showToast(`Removed "${medTitle}" listing`, "info");
        setListings((prev) => prev.filter((l) => (l._id || l.id) !== medId));
      } else {
        showToast(res.data?.message || "Could not delete listing", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove listing", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelOrder = async (orderId, orderNum) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel order ${orderNum}? Medicine inventory will be restored.`
      )
    ) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`, {
        reason: "Cancelled by member via Dashboard",
      });
      if (res.data?.success) {
        showToast("Order cancelled and medicine stock restored", "info");
        fetchOrders();
        fetchListings();
        fetchSellerOrders();
      } else {
        showToast(res.data?.message || "Could not cancel order", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, targetStatus, itemId, medName) => {
    const statusKey = `${orderId}-${itemId || "all"}`;
    setUpdatingStatusKey(statusKey);

    try {
      const payload = { status: targetStatus };
      if (itemId) {
        payload.itemId = itemId;
      }

      const res = await api.patch(`/orders/${orderId}/status`, payload);
      if (res.data?.success) {
        showToast(
          medName
            ? `Updated "${medName}" status to "${targetStatus}"`
            : `Order updated to "${targetStatus}"`,
          "success"
        );
        fetchSellerOrders();
        fetchOrders();
        fetchListings();
      } else {
        showToast(res.data?.message || "Failed to update order status", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setUpdatingStatusKey(null);
    }
  };

  // Prescription Upload Handlers
  const handleUploadRxSubmit = async (e) => {
    e.preventDefault();
    if (!rxFormData.patientName.trim()) {
      showToast("Patient name is required", "error");
      return;
    }
    if (!rxFile) {
      showToast("Please select a prescription file (PDF, JPG, PNG)", "error");
      return;
    }
    if (rxFile.size > 5 * 1024 * 1024) {
      showToast("Prescription file must be under 5 MB", "error");
      return;
    }

    setIsUploadingRx(true);
    try {
      const data = new FormData();
      data.append("prescription", rxFile);
      data.append("patientName", rxFormData.patientName.trim());
      if (rxFormData.doctorName) data.append("doctorName", rxFormData.doctorName.trim());
      if (rxFormData.doctorRegistrationNumber)
        data.append("doctorRegistrationNumber", rxFormData.doctorRegistrationNumber.trim());
      if (rxFormData.prescribedSalts)
        data.append("prescribedSalts", rxFormData.prescribedSalts.trim());

      const res = await api.post("/prescriptions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        showToast("Prescription uploaded successfully for verification!", "success");
        setIsUploadRxModalOpen(false);
        setRxFormData({
          patientName: "",
          doctorName: "",
          doctorRegistrationNumber: "",
          prescribedSalts: "",
        });
        setRxFile(null);
        fetchPrescriptions();
      } else {
        showToast(res.data?.message || "Upload failed", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload prescription", "error");
    } finally {
      setIsUploadingRx(false);
    }
  };

  const handleViewPrescriptionDoc = async (rx) => {
    const rxId = rx._id || rx.id;
    setPreviewRx(rx);
    setIsLoadingDoc(true);
    setPreviewBlobUrl(null);

    try {
      const res = await api.get(`/prescriptions/${rxId}/document`, {
        responseType: "blob",
      });
      const mimeType = rx.documentMimeType || res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      let errMsg = "Failed to retrieve prescription document";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch (_parseErr) {
          void _parseErr;
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      showToast(errMsg, "error");
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const activeCount = listings.filter((l) => l.status === "approved").length;
  const acceptedCount = listings.filter((l) => l.status === "accepted").length;
  const completedCount = listings.filter((l) => l.status === "completed" || l.status === "sold").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const rejectedCount = listings.filter((l) => l.status === "rejected").length;

  const filteredListings = listings.filter((l) => {
    if (listingFilter === "all") return true;
    if (listingFilter === "sold") return l.status === "sold" || l.status === "completed";
    return l.status === listingFilter;
  });

  const acceptedListings = listings.filter((l) => l.status === "accepted");

  return (
    <div className="min-h-screen bg-canvas py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: "Member Dashboard", href: "/dashboard" }]} />

        {/* Dashboard Header Profile Banner */}
        <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-line shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center font-extrabold text-2xl shadow-xs">
                {currentUser.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                  Welcome, {currentUser.name}
                </h1>
                <Badge variant="verified" size="sm">
                  {currentUser.role === "admin" ? "Administrator" : "Verified Member"}
                </Badge>
              </div>
              <p className="text-xs text-ink-muted">
                {currentUser.email} • {currentUser.address?.split(",")[0] || "Pune, MH"}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3 w-full sm:w-auto">
            {currentUser.role === "admin" && (
              <Link to="/admin" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full bg-warning-tint border-warning-line text-warning hover:bg-warning-tint font-bold shadow-xs"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-warning" />
                  Admin Console
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsUploadRxModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <UploadIcon className="w-4 h-4 text-brand" />
              Upload Prescription
            </Button>
            <Link to="/sell" className="flex-1 sm:flex-none">
              <Button variant="primary" size="md" className="w-full shadow-xs">
                <PlusIcon className="w-4 h-4" />
                Donate Medicine
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="bg-white rounded-xl border border-line p-5 shadow-xs">
            <div className="flex items-center justify-between text-ink-subtle text-xs font-semibold mb-2">
              <span>Cabinet Tracker</span>
              <div className="w-8 h-8 rounded-lg bg-brand-tint text-brand flex items-center justify-center">
                <PackageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-ink">{cabinetItems.length}</div>
            <span className="text-[11px] text-brand font-medium">
              Household medicines logged
            </span>
          </div>

          <div className="bg-white rounded-xl border border-line p-5 shadow-xs">
            <div className="flex items-center justify-between text-ink-subtle text-xs font-semibold mb-2">
              <span>Active Donations</span>
              <div className="w-8 h-8 rounded-lg bg-brand-tint text-brand flex items-center justify-center">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-ink">{activeCount}</div>
            <span className="text-[11px] text-brand font-medium">
              Approved for redistribution
            </span>
          </div>

          <div className="bg-white rounded-xl border border-line p-5 shadow-xs">
            <div className="flex items-center justify-between text-ink-subtle text-xs font-semibold mb-2">
              <span>Pending Review</span>
              <div className="w-8 h-8 rounded-lg bg-warning-tint text-warning flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-ink">{pendingCount}</div>
            <span className="text-[11px] text-warning font-medium">
              Under coordinator inspection
            </span>
          </div>

          <div className="bg-white rounded-xl border border-line p-5 shadow-xs">
            <div className="flex items-center justify-between text-ink-subtle text-xs font-semibold mb-2">
              <span>Prescriptions</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                <FileTextIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-ink">{prescriptions.length}</div>
            <span className="text-[11px] text-purple-800 font-medium">
              {prescriptions.filter((p) => p.status === "approved").length} approved records
            </span>
          </div>
        </div>

        {/* Tabbed Activity Center */}
        <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden text-left">
          {/* Tabs Bar */}
          <div className="flex border-b border-line px-6 overflow-x-auto bg-surface-alt">
            <button
              onClick={() => setActiveTab("cabinet")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "cabinet"
                  ? "border-brand text-brand bg-white"
                  : "border-transparent text-ink-subtle hover:text-ink"
              }`}
            >
              💊 My Medicine Cabinet ({cabinetItems.length})
            </button>
            <button
              onClick={() => setActiveTab("listings")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "listings"
                  ? "border-brand text-brand bg-white"
                  : "border-transparent text-ink-subtle hover:text-ink"
              }`}
            >
              Donation Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "prescriptions"
                  ? "border-brand text-brand bg-white"
                  : "border-transparent text-ink-subtle hover:text-ink"
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
          </div>

          {/* TAB: MY MEDICINE CABINET */}
          {activeTab === "cabinet" && (
            <div className="p-6 space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-alt p-5 rounded-2xl border border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-ink">
                      Household Medicine Cabinet Tracker
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-tint text-brand">
                      {cabinetItems.length} Logged
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
                    Keep track of unused household medicines. Items with ≥3 months remaining are eligible for verified community donation. Expired or unsealed medicines route to safe household disposal.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddCabinetModalOpen(true)}
                  className="shrink-0 bg-brand hover:bg-brand-strong"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Medicine to Cabinet
                </Button>
              </div>

              {/* Status Color Key / Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-success-line bg-success-tint text-[#166534] flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#16a34a] shrink-0"></div>
                  <div>
                    <strong className="block font-bold">GREEN: &gt;6 Months Shelf Life</strong>
                    <span className="text-[11px] text-success">Healthy stock · Eligible for donation</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-warning-line bg-warning-tint text-warning flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-warning shrink-0"></div>
                  <div>
                    <strong className="block font-bold">AMBER: 3–6 Months Shelf Life</strong>
                    <span className="text-[11px] text-warning">Expiring Soon · Action Recommended</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-danger-line bg-danger-tint text-danger flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#e11d48] shrink-0"></div>
                  <div>
                    <strong className="block font-bold">RED: &lt;3 Months or Expired</strong>
                    <span className="text-[11px] text-danger">Ineligible · Follow Safe Disposal</span>
                  </div>
                </div>
              </div>

              {/* Cabinet Items Grid */}
              {cabinetItems.length === 0 ? (
                <EmptyState
                  icon={PackageIcon}
                  title="Your Medicine Cabinet is empty"
                  description="Keep track of household medicines to donate before expiry or dispose safely."
                  actionLabel="Add Medicine"
                  onAction={() => setIsAddCabinetModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cabinetItems.map((item) => {
                    const status = getCabinetItemStatus(item.expiryDate);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border-2 transition flex flex-col justify-between shadow-2xs ${
                          status.color === "green"
                            ? "border-success-line bg-success-tint/60"
                            : status.color === "amber"
                            ? "border-warning-line bg-warning-tint/60"
                            : "border-danger-line bg-danger-tint/60"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                status.color === "green"
                                  ? "bg-success-tint text-success"
                                  : status.color === "amber"
                                  ? "bg-warning-tint text-warning"
                                  : "bg-danger-tint text-danger"
                              }`}
                            >
                              {status.label}
                            </span>
                            <button
                              onClick={() => handleDeleteCabinetItem(item.id, item.name)}
                              className="text-ink-faint hover:text-[#e11d48] transition p-1"
                              title="Remove from cabinet"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-ink">{item.name}</h3>

                          <div className="text-xs text-ink-muted space-y-0.5">
                            <div>
                              <span className="font-semibold text-ink">Quantity:</span> {item.quantity} {item.unit || "units"} ({item.form || "Tablet"})
                            </div>
                            <div>
                              <span className="font-semibold text-ink">Category:</span> {item.category || "General Health"}
                            </div>
                            <div className="font-mono text-[11px] pt-1">
                              <span className="font-semibold text-ink">Expiry:</span> {item.expiryDate}
                            </div>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="pt-3 mt-3 border-t border-line">
                          {status.eligible ? (
                            <Link
                              to={`/sell?name=${encodeURIComponent(item.name)}&quantity=${item.quantity}&category=${encodeURIComponent(item.category || "General Health")}&form=${encodeURIComponent(item.form || "Tablet")}`}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-lg transition shadow-2xs"
                            >
                              <span>🎁 Donate This</span>
                            </Link>
                          ) : (
                            <Link
                              to="/disposal-guide"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#e11d48] hover:bg-danger text-white text-xs font-bold rounded-lg transition shadow-2xs"
                            >
                              <span>♻️ Safe Disposal Guide</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DONATION LISTINGS */}
          {activeTab === "listings" && (
            <div className="p-6 space-y-6">
              {/* Active Accepted Handovers Banner for Donor */}
              {acceptedListings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
                    <ShieldCheckIcon className="w-4 h-4 text-brand" />
                    <span>Action Required: Physical Medicine Handover</span>
                  </div>

                  {acceptedListings.map((accItem) => (
                    <div
                      key={accItem._id || accItem.id}
                      className="bg-success-tint border-2 border-success-line rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-tint text-success">
                          🤝 Accepted by {accItem.acceptedBy?.organizationName || accItem.acceptedBy?.name || "Verified Partner Organization"}
                        </div>
                        <h3 className="text-base font-bold text-[#064e3b]">
                          {accItem.brandName || accItem.medicineName} ({accItem.quantity} {accItem.unit || "units"})
                        </h3>
                        <p className="text-xs text-[#047857]">
                          Please hand over this medicine at: <strong>{accItem.handoverPoint || accItem.locality || "Designated Location"}</strong>. Provide the secure code below to the partner during physical collection:
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-success-line text-center shadow-xs shrink-0 space-y-1">
                        <span className="text-[10px] font-bold text-success uppercase tracking-wider block">
                          6-Digit Handover Code
                        </span>
                        <div className="text-2xl font-mono font-black text-brand tracking-widest px-3 py-0.5 bg-success-tint rounded-lg border border-success-line">
                          {accItem.handoverCode || "Pending"}
                        </div>
                        <span className="text-[10px] text-ink-subtle block">
                          Give to partner representative
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {[
                  { id: "all", label: `All (${listings.length})` },
                  { id: "approved", label: `Active (${activeCount})` },
                  { id: "accepted", label: `Accepted (${acceptedCount})` },
                  { id: "sold", label: `Completed (${completedCount})` },
                  { id: "pending", label: `Pending (${pendingCount})` },
                  { id: "rejected", label: `Rejected (${rejectedCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setListingFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      listingFilter === f.id
                        ? "bg-brand text-white"
                        : "bg-surface-alt text-ink-muted border border-line hover:bg-canvas"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {isLoadingListings ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-ink-muted">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-subtle bg-surface-alt border-b border-line">
                      <tr>
                        <th className="py-3 px-4 font-bold">Medicine Name</th>
                        <th className="py-3 px-4 font-bold">Category</th>
                        <th className="py-3 px-4 font-bold">Type</th>
                        <th className="py-3 px-4 font-bold">Expiry Date</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredListings.map((item) => {
                        const medId = item._id || item.id;
                        const title = item.brandName || item.medicineName || item.name;
                        const expiryStr =
                          item.expiryText ||
                          (item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-");

                        return (
                          <tr key={medId} className="hover:bg-surface-alt transition">
                            <td className="py-4 px-4 font-semibold text-ink">
                              <div>{title}</div>
                              <div className="text-xs text-ink-subtle font-normal">
                                {item.company} {item.strength ? `(${item.strength})` : ""} · {item.quantity} {item.unit || "units"}
                              </div>
                              {item.isPrescriptionRequired && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded">
                                  Rx Required
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-ink-muted">{item.category}</td>
                            <td className="py-4 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-success-tint text-success border border-success-line">
                                🎁 Free Donation
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs font-mono">{expiryStr}</td>
                            <td className="py-4 px-4">
                              {item.status === "approved" && (
                                <Badge variant="success" size="sm">
                                  Active / Available
                                </Badge>
                              )}
                              {item.status === "accepted" && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-warning-tint text-warning border border-warning-line">
                                    🤝 Accepted by Partner
                                  </span>
                                  {item.handoverCode && (
                                    <div className="text-[11px] font-mono font-bold text-brand">
                                      Code: <span className="underline">{item.handoverCode}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.status === "completed" && (
                                <Badge variant="default" size="sm">
                                  ✅ Handover Completed
                                </Badge>
                              )}
                              {item.status === "pending" && (
                                <Badge variant="warning" size="sm">
                                  Pending Review
                                </Badge>
                              )}
                              {item.status === "rejected" && (
                                <div>
                                  <Badge variant="danger" size="sm">
                                    Rejected
                                  </Badge>
                                  {item.rejectionReason && (
                                    <p className="text-[10px] text-danger mt-0.5 max-w-xs">
                                      {item.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                              {item.status === "sold" && (
                                <Badge variant="default" size="sm">
                                  Completed
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  to={`/medicine/${medId}`}
                                  className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                                >
                                  View
                                </Link>
                                {item.status !== "accepted" && item.status !== "completed" && (
                                  <button
                                    onClick={() => handleDeleteListing(medId, title)}
                                    disabled={deletingId === medId}
                                    className="text-xs font-semibold text-danger hover:text-danger transition cursor-pointer disabled:opacity-50"
                                    title="Delete listing"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No medicine listings in this category"
                  description="Have unused, unexpired surplus medicine? List it on MEDISAVE to assist patients in need."
                  actionLabel="Donate a Medicine"
                  actionLink="/sell"
                />
              )}
            </div>
          )}

          {/* TAB 2: SELLER ORDERS FULFILLMENT */}
          {activeTab === "seller-orders" && (
            <div className="p-6">
              {isLoadingSellerOrders ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sellerOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-ink-muted">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-subtle bg-surface-alt border-b border-line">
                      <tr>
                        <th className="py-3 px-4 font-bold">Order Ref</th>
                        <th className="py-3 px-4 font-bold">Recipient Details</th>
                        <th className="py-3 px-4 font-bold">Medicine Requested</th>
                        <th className="py-3 px-4 font-bold">Qty</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Fulfillment Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {sellerOrders.map((order) => {
                        const orderId = order._id;
                        const orderNum =
                          order.orderNumber ||
                          `#MED-2026-${orderId ? orderId.slice(-4).toUpperCase() : "XXXX"}`;

                        const buyerName =
                          order.buyer?.name || order.shippingAddress?.fullName || "Buyer";
                        const buyerContact =
                          order.shippingAddress?.phone || order.buyer?.phone || "";
                        const buyerCity = order.shippingAddress?.city || "Pune";

                        return order.items?.map((item, itemIdx) => {
                          const itemId = item._id || item.medicine?._id || item.medicine;
                          const itemStatus = item.status || order.status || "pending";
                          const isUpdating =
                            updatingStatusKey === `${orderId}-${itemId}` ||
                            updatingStatusKey === `${orderId}-all`;

                          const medTitle = item.brandName || item.medicineName || "Medicine";
                          const itemTotalAmount = item.price * item.quantity;

                          return (
                            <tr
                              key={`${orderId}-${itemId}-${itemIdx}`}
                              className="hover:bg-surface-alt transition"
                            >
                              <td className="py-4 px-4 font-mono font-bold text-ink">
                                <div>{orderNum}</div>
                                <span className="text-[11px] text-ink-subtle font-sans font-normal">
                                  {order.paymentMethod || "Physical Handover"}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-ink">
                                <div className="font-semibold">{buyerName}</div>
                                <div className="text-[11px] text-ink-subtle">
                                  {buyerContact ? `${buyerContact} • ` : ""}
                                  {buyerCity}
                                </div>
                              </td>

                              <td className="py-4 px-4 font-semibold text-ink">
                                <div>{medTitle}</div>
                                <div className="text-[11px] text-ink-subtle font-normal">
                                  {item.company} {item.strength ? `(${item.strength})` : ""}
                                </div>
                              </td>

                              <td className="py-4 px-4 font-mono text-ink">
                                × {item.quantity}
                              </td>

                              <td className="py-4 px-4 font-bold text-brand font-mono">
                                ₹{itemTotalAmount}
                              </td>

                              <td className="py-4 px-4">
                                {itemStatus === "pending" && (
                                  <Badge variant="warning" size="sm">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    Pending
                                  </Badge>
                                )}
                                {itemStatus === "confirmed" && (
                                  <Badge variant="brand" size="sm">
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Confirmed
                                  </Badge>
                                )}
                                {itemStatus === "processing" && (
                                  <Badge variant="warning" size="sm">
                                    Processing
                                  </Badge>
                                )}
                                {itemStatus === "shipped" && (
                                  <Badge variant="brand" size="sm">
                                    Shipped
                                  </Badge>
                                )}
                                {itemStatus === "delivered" && (
                                  <Badge variant="success" size="sm">
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Delivered
                                  </Badge>
                                )}
                                {itemStatus === "cancelled" && (
                                  <Badge variant="danger" size="sm">
                                    Cancelled
                                  </Badge>
                                )}
                              </td>

                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {itemStatus === "pending" && (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "confirmed",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-xs font-semibold"
                                      >
                                        {isUpdating ? "Updating..." : "Confirm"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "cancelled",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-danger hover:bg-danger-tint border-danger-line text-xs"
                                      >
                                        Decline
                                      </Button>
                                    </>
                                  )}

                                  {itemStatus === "confirmed" && (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "processing",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-xs font-semibold bg-warning hover:bg-warning"
                                      >
                                        {isUpdating ? "Updating..." : "Start Packaging"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "cancelled",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-danger hover:bg-danger-tint border-danger-line text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}

                                  {itemStatus === "processing" && (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "shipped",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-xs font-semibold"
                                      >
                                        {isUpdating ? "Updating..." : "Mark Dispatched"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            orderId,
                                            "cancelled",
                                            itemId,
                                            medTitle
                                          )
                                        }
                                        disabled={isUpdating}
                                        className="text-danger hover:bg-danger-tint border-danger-line text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}

                                  {itemStatus === "shipped" && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateOrderStatus(
                                          orderId,
                                          "delivered",
                                          itemId,
                                          medTitle
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="text-xs font-semibold bg-success hover:bg-success"
                                    >
                                      {isUpdating ? "Updating..." : "Mark Delivered"}
                                    </Button>
                                  )}

                                  {itemStatus === "delivered" && (
                                    <span className="text-xs font-semibold text-success flex items-center gap-1 justify-end">
                                      <CheckIcon className="w-3.5 h-3.5" /> Fulfilled
                                    </span>
                                  )}

                                  {itemStatus === "cancelled" && (
                                    <span className="text-xs text-ink-subtle italic">Cancelled</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No incoming orders to fulfill"
                  description="When community members request medicines from your listings, they will appear here for verification and handover."
                />
              )}
            </div>
          )}

          {/* TAB 3: MY BUYER ORDERS */}
          {activeTab === "orders" && (
            <div className="p-6">
              {isLoadingOrders ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const orderId = order._id;
                    const orderNum =
                      order.orderNumber ||
                      (orderId ? `#MED-2026-${orderId.slice(-4).toUpperCase()}` : "#MED-ORDER");
                    const orderDate = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Recently";

                    const isCancellable = ["pending", "confirmed", "processing"].includes(
                      order.status
                    );

                    // Order Lifecycle Pipeline Stages
                    const stages = ["pending", "confirmed", "processing", "shipped", "delivered"];
                    const currentIdx = stages.indexOf(order.status);
                    const isCancelled = order.status === "cancelled";

                    return (
                      <div
                        key={orderId}
                        className="p-5 rounded-xl border border-line bg-surface-alt space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ink text-sm">
                              {orderNum}
                            </span>
                            <span className="text-xs text-ink-subtle">• Placed on {orderDate}</span>
                          </div>
                          <div>
                            {order.status === "confirmed" && (
                              <Badge variant="brand" size="sm">
                                <CheckIcon className="w-3.5 h-3.5" />
                                Confirmed
                              </Badge>
                            )}
                            {order.status === "processing" && (
                              <Badge variant="warning" size="sm">
                                <ClockIcon className="w-3.5 h-3.5" />
                                Processing
                              </Badge>
                            )}
                            {order.status === "shipped" && (
                              <Badge variant="brand" size="sm">
                                Dispatched
                              </Badge>
                            )}
                            {order.status === "delivered" && (
                              <Badge variant="success" size="sm">
                                <CheckIcon className="w-3.5 h-3.5" />
                                Delivered
                              </Badge>
                            )}
                            {order.status === "cancelled" && (
                              <Badge variant="danger" size="sm">
                                Cancelled
                              </Badge>
                            )}
                            {order.status === "pending" && (
                              <Badge variant="warning" size="sm">
                                <ClockIcon className="w-3.5 h-3.5" />
                                Pending Confirmation
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Order Lifecycle Progress Bar: Realistic Community Handover Model */}
                        {!isCancelled && (
                          <div className="py-2.5 px-3 bg-white rounded-lg border border-line space-y-2">
                            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-ink-subtle tracking-tight">
                              <span className={currentIdx >= 0 ? "text-brand" : ""}>1. ORDER PLACED</span>
                              <span className={currentIdx >= 1 ? "text-brand" : ""}>2. DONOR CONFIRMS</span>
                              <span className={currentIdx >= 2 ? "text-brand" : ""}>3. READY FOR HANDOVER</span>
                              <span className={currentIdx >= 3 ? "text-brand" : ""}>4. DONOR + RECIPIENT COORDINATE</span>
                              <span className={currentIdx >= 4 ? "text-success" : ""}>5. HANDOVER COMPLETED</span>
                            </div>
                            <div className="w-full bg-line h-2 rounded-full overflow-hidden flex">
                              <div
                                className="bg-brand h-full transition-all duration-300"
                                style={{
                                  width: `${
                                    currentIdx === -1
                                      ? 10
                                      : ((currentIdx + 1) / stages.length) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-ink-subtle italic">
                              Handover method: Community pickup / mutually agreed location
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 text-xs">
                          {order.items?.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-ink-muted"
                            >
                              <div>
                                <span className="font-medium text-ink">
                                  {it.brandName || it.medicineName}
                                </span>
                                {it.strength && (
                                  <span className="text-ink-subtle ml-1.5 font-mono text-[11px]">
                                    ({it.strength})
                                  </span>
                                )}
                                <span className="text-ink-muted ml-2">× {it.quantity}</span>
                              </div>
                              <span className="font-semibold text-ink font-mono">
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div className="space-y-0.5 text-ink-muted">
                            <div>
                              Handover Location:{" "}
                              <strong className="text-ink">
                                {order.shippingAddress?.address}, {order.shippingAddress?.city}
                              </strong>
                            </div>
                            <div className="text-[11px]">
                              Recipient: {order.shippingAddress?.fullName} ({order.shippingAddress?.phone}) • Mode: {order.paymentMethod}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-sm font-bold text-brand font-mono">
                              Total: ₹{order.totalAmount}
                            </span>
                            {isCancellable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(orderId, orderNum)}
                                disabled={cancellingOrderId === orderId}
                                className="text-danger hover:bg-danger-tint border-danger-line text-xs"
                              >
                                {cancellingOrderId === orderId ? "Cancelling..." : "Cancel Order"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No medicine orders placed yet"
                  description="Browse verified, unexpired medicines from community members at subsidized rates."
                  actionLabel="Browse Available Medicines"
                  actionLink="/buy"
                />
              )}
            </div>
          )}

          {/* TAB 4: PRESCRIPTIONS */}
          {activeTab === "prescriptions" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-base font-bold text-ink">
                    My Uploaded Prescriptions
                  </h2>
                  <p className="text-xs text-ink-subtle">
                    Prescriptions verified by coordinators can be used to request Schedule H and Rx
                    medications during redistribution.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUploadRxModalOpen(true)}
                  className="shadow-xs"
                >
                  <UploadIcon className="w-4 h-4" />
                  Upload New Prescription
                </Button>
              </div>

              {isLoadingPrescriptions ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-ink-muted">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-subtle bg-surface-alt border-b border-line">
                      <tr>
                        <th className="py-3 px-4 font-bold">Patient Name</th>
                        <th className="py-3 px-4 font-bold">Doctor & Reg No</th>
                        <th className="py-3 px-4 font-bold">Prescribed Salts</th>
                        <th className="py-3 px-4 font-bold">Uploaded File</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {prescriptions.map((rx) => {
                        const rxId = rx._id || rx.id;
                        const uploadDate = rx.createdAt
                          ? new Date(rx.createdAt).toLocaleDateString()
                          : "-";
                        const isExpired =
                          rx.status === "approved" &&
                          rx.validUntil &&
                          new Date(rx.validUntil) <= new Date();

                        return (
                          <tr key={rxId} className="hover:bg-surface-alt transition">
                            <td className="py-4 px-4 font-semibold text-ink">
                              {rx.patientName}
                            </td>

                            <td className="py-4 px-4 text-ink-muted">
                              <div>{rx.doctorName || "Not specified"}</div>
                              {rx.doctorRegistrationNumber && (
                                <span className="text-[11px] text-ink-subtle font-mono">
                                  Reg: {rx.doctorRegistrationNumber}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-xs text-ink-muted max-w-xs truncate">
                              {rx.prescribedSalts || "-"}
                            </td>

                            <td className="py-4 px-4 text-xs text-ink-subtle">
                              <div className="font-mono truncate max-w-[150px]">
                                {rx.documentOriginalName || "document.pdf"}
                              </div>
                              <span className="text-[11px] text-ink-subtle">{uploadDate}</span>
                            </td>

                            <td className="py-4 px-4">
                              {isExpired ? (
                                <Badge variant="danger" size="sm">
                                  Expired
                                </Badge>
                              ) : rx.status === "approved" ? (
                                <div>
                                  <Badge variant="success" size="sm">
                                    Approved
                                  </Badge>
                                  {rx.validUntil && (
                                    <span className="block text-[10px] text-ink-subtle mt-0.5">
                                      Valid until {new Date(rx.validUntil).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : rx.status === "rejected" ? (
                                <div>
                                  <Badge variant="danger" size="sm">
                                    Rejected
                                  </Badge>
                                  {rx.rejectionReason && (
                                    <p className="text-[10px] text-danger mt-0.5 line-clamp-1">
                                      {rx.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Pending Review
                                </Badge>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPrescriptionDoc(rx)}
                                className="text-xs"
                              >
                                View Document
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No prescriptions uploaded yet"
                  description="Upload valid doctor prescriptions to request Schedule H and prescription-only medications securely."
                  actionLabel="Upload Prescription"
                  actionLink="#"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Prescription Modal */}
      <Modal
        isOpen={isUploadRxModalOpen}
        onClose={() => setIsUploadRxModalOpen(false)}
        title="Upload Doctor Prescription"
      >
        <form onSubmit={handleUploadRxSubmit} className="space-y-4 text-left">
          <p className="text-xs text-ink-muted leading-relaxed">
            Upload an authentic doctor prescription. Community coordinators will inspect patient
            name, registration credentials, and prescribed medications for verification.
          </p>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Patient Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={rxFormData.patientName}
              onChange={(e) =>
                setRxFormData({ ...rxFormData, patientName: e.target.value })
              }
              placeholder="e.g. Rahul Patil"
              className="w-full bg-surface-alt border border-line text-xs rounded-xl p-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Prescribing Doctor Name
              </label>
              <input
                type="text"
                value={rxFormData.doctorName}
                onChange={(e) =>
                  setRxFormData({ ...rxFormData, doctorName: e.target.value })
                }
                placeholder="e.g. Dr. K. Deshmukh"
                className="w-full bg-surface-alt border border-line text-xs rounded-xl p-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Doctor Registration No.
              </label>
              <input
                type="text"
                value={rxFormData.doctorRegistrationNumber}
                onChange={(e) =>
                  setRxFormData({
                    ...rxFormData,
                    doctorRegistrationNumber: e.target.value,
                  })
                }
                placeholder="e.g. MMC-2018-0943"
                className="w-full bg-surface-alt border border-line text-xs rounded-xl p-3 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Prescribed Generic Salts / Medications
            </label>
            <input
              type="text"
              value={rxFormData.prescribedSalts}
              onChange={(e) =>
                setRxFormData({ ...rxFormData, prescribedSalts: e.target.value })
              }
              placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
              className="w-full bg-surface-alt border border-line text-xs rounded-xl p-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Prescription Document File (PDF, JPG, PNG up to 5 MB) <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              onChange={(e) => setRxFile(e.target.files[0] || null)}
              className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-tint file:text-brand hover:file:bg-brand-line cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsUploadRxModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isUploadingRx}
            >
              Submit Prescription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secure Prescription Document Preview Modal */}
      <Modal
        isOpen={Boolean(previewRx)}
        onClose={() => {
          setPreviewRx(null);
          if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
          }
        }}
        title={`Prescription: ${previewRx?.patientName || "Document"}`}
      >
        <div className="space-y-4 text-left">
          <div className="p-3 bg-surface-alt border border-line rounded-xl text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-ink-subtle block">Patient Name</span>
              <strong className="text-ink">{previewRx?.patientName}</strong>
            </div>
            <div>
              <span className="text-ink-subtle block">Doctor & Reg</span>
              <strong className="text-ink">
                {previewRx?.doctorName || "Not specified"}{" "}
                {previewRx?.doctorRegistrationNumber
                  ? `(${previewRx.doctorRegistrationNumber})`
                  : ""}
              </strong>
            </div>
            {previewRx?.prescribedSalts && (
              <div className="col-span-2">
                <span className="text-ink-subtle block">Prescribed Salts</span>
                <span className="text-ink font-medium">{previewRx.prescribedSalts}</span>
              </div>
            )}
          </div>

          <div className="border border-line rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[350px] max-h-[480px]">
            {isLoadingDoc ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-ink-subtle">Loading secure document...</span>
              </div>
            ) : previewBlobUrl ? (
              previewRx?.documentMimeType?.includes("pdf") ? (
                <iframe
                  src={previewBlobUrl}
                  title="Prescription Preview"
                  className="w-full h-[450px] border-none"
                />
              ) : (
                <img
                  src={previewBlobUrl}
                  alt="Prescription"
                  className="max-h-[450px] max-w-full object-contain p-2"
                />
              )
            ) : (
              <div className="p-8 text-center text-ink-subtle text-xs">
                Unable to preview document.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {previewBlobUrl && (
              <a
                href={previewBlobUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Open in Fullscreen / New Window
              </a>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setPreviewRx(null);
                if (previewBlobUrl) {
                  URL.revokeObjectURL(previewBlobUrl);
                  setPreviewBlobUrl(null);
                }
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Medicine to Cabinet Modal */}
      <Modal
        isOpen={isAddCabinetModalOpen}
        onClose={() => setIsAddCabinetModalOpen(false)}
        title="Add Medicine to Cabinet Tracker"
      >
        <form onSubmit={handleAddCabinetSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
              Medicine Brand / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paracetamol 650mg, Dolo 650, Azithromycin 500mg"
              value={cabinetFormData.name}
              onChange={(e) => setCabinetFormData({ ...cabinetFormData, name: e.target.value })}
              className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={cabinetFormData.quantity}
                onChange={(e) => setCabinetFormData({ ...cabinetFormData, quantity: e.target.value })}
                className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Unit
              </label>
              <select
                value={cabinetFormData.unit}
                onChange={(e) => setCabinetFormData({ ...cabinetFormData, unit: e.target.value })}
                className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="strip">Sealed Strip</option>
                <option value="bottle">Bottle (Sealed)</option>
                <option value="units">Units</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={cabinetFormData.expiryDate}
                onChange={(e) => setCabinetFormData({ ...cabinetFormData, expiryDate: e.target.value })}
                className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Category
              </label>
              <select
                value={cabinetFormData.category}
                onChange={(e) => setCabinetFormData({ ...cabinetFormData, category: e.target.value })}
                className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="General Health">General Health</option>
                <option value="Pain & Fever">Pain & Fever</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Allergy & Cold">Allergy & Cold</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddCabinetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-brand hover:bg-brand-strong"
            >
              Save to Cabinet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}