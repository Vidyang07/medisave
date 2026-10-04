import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import {
  ShieldCheckIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  PackageIcon,
  ShoppingBagIcon,
  UserIcon,
  SearchIcon,
  AlertCircleIcon,
  FileTextIcon,
} from "../components/common/Icons";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("pending"); // 'pending', 'prescriptions', 'medicines', 'orders', 'users'
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Pending Queue & All Medicines State
  const [medicines, setMedicines] = useState([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [medicineStatusFilter, setMedicineStatusFilter] = useState("all");
  const [medicineSearch, setMedicineSearch] = useState("");

  // Prescriptions Verification State
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(true);
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState("pending");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Users State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Partner Organizations State
  const [partners, setPartners] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [partnerFilter, setPartnerFilter] = useState("all");

  // Action Loading & Modal State
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectModalMedicine, setRejectModalMedicine] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Prescription Modals State
  const [approveModalPrescription, setApproveModalPrescription] = useState(null);
  const [validityDate, setValidityDate] = useState("");
  const [rejectModalPrescription, setRejectModalPrescription] = useState(null);
  const [prescriptionRejectionReason, setPrescriptionRejectionReason] = useState("");
  const [previewModalPrescription, setPreviewModalPrescription] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  const fetchStats = () => {
    setIsLoadingStats(true);
    api
      .get("/admin/stats")
      .then((res) => {
        if (res.data?.success) {
          setStats(res.data.data);
        }
        setIsLoadingStats(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin stats:", err.message);
        setIsLoadingStats(false);
      });
  };

  const fetchPrescriptions = (
    status = prescriptionStatusFilter,
    search = prescriptionSearch
  ) => {
    setIsLoadingPrescriptions(true);
    const params = {};
    if (status && status !== "all") params.status = status;
    if (search && search.trim()) params.search = search.trim();

    api
      .get("/admin/prescriptions", { params })
      .then((res) => {
        if (res.data?.success) {
          setPrescriptions(res.data.data || []);
        }
        setIsLoadingPrescriptions(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin prescriptions:", err.message);
        setIsLoadingPrescriptions(false);
      });
  };

  const fetchMedicines = (status = medicineStatusFilter, search = medicineSearch) => {
    setIsLoadingMedicines(true);
    const params = {};
    if (status && status !== "all") params.status = status;
    if (search && search.trim()) params.search = search.trim();

    api
      .get("/admin/medicines", { params })
      .then((res) => {
        if (res.data?.success) {
          setMedicines(res.data.data || []);
        }
        setIsLoadingMedicines(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin medicines:", err.message);
        setIsLoadingMedicines(false);
      });
  };

  const fetchOrders = (status = orderStatusFilter) => {
    setIsLoadingOrders(true);
    const params = {};
    if (status && status !== "all") params.status = status;

    api
      .get("/admin/orders", { params })
      .then((res) => {
        if (res.data?.success) {
          setOrders(res.data.data || []);
        }
        setIsLoadingOrders(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin orders:", err.message);
        setIsLoadingOrders(false);
      });
  };

  const fetchUsers = () => {
    setIsLoadingUsers(true);
    api
      .get("/admin/users")
      .then((res) => {
        if (res.data?.success) {
          setUsers(res.data.data || []);
        }
        setIsLoadingUsers(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin users:", err.message);
        setIsLoadingUsers(false);
      });
  };

  const fetchPartners = (status = partnerFilter) => {
    setIsLoadingPartners(true);
    const params = {};
    if (status && status !== "all") params.status = status;

    api
      .get("/admin/partners", { params })
      .then((res) => {
        if (res.data?.success) {
          setPartners(res.data.data || []);
        }
        setIsLoadingPartners(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch admin partners:", err.message);
        setIsLoadingPartners(false);
      });
  };

  const handleModeratePartner = async (partnerId, targetStatus) => {
    setActionLoadingId(`partner-${partnerId}`);
    try {
      const res = await api.patch(`/admin/partners/${partnerId}/verify`, {
        partnerStatus: targetStatus,
      });
      if (res.data?.success) {
        showToast(`Partner organization marked as "${targetStatus}"`, "success");
        fetchPartners();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update partner organization", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    api
      .get("/admin/stats")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setStats(res.data.data);
          setIsLoadingStats(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingStats(false);
      });

    api
      .get("/admin/medicines")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setMedicines(res.data.data || []);
          setIsLoadingMedicines(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingMedicines(false);
      });

    api
      .get("/admin/orders")
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
      .get("/admin/users")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setUsers(res.data.data || []);
          setIsLoadingUsers(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    api
      .get("/admin/partners")
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) setPartners(res.data.data || []);
          setIsLoadingPartners(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPartners(false);
      });

    api
      .get("/admin/prescriptions")
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

  // Handle Approve Medicine
  const handleApproveMedicine = async (medId, medTitle) => {
    setActionLoadingId(`approve-${medId}`);
    try {
      const res = await api.patch(`/admin/medicines/${medId}/status`, {
        status: "approved",
      });
      if (res.data?.success) {
        showToast(`Approved "${medTitle}" for public exchange`, "success");
        fetchStats();
        fetchMedicines();
      } else {
        showToast(res.data?.message || "Failed to approve medicine", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error approving medicine", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Medicine Modal Open
  const handleOpenRejectModal = (med) => {
    setRejectModalMedicine(med);
    setRejectionReason("");
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectModalMedicine) return;
    const medId = rejectModalMedicine._id || rejectModalMedicine.id;
    const medTitle = rejectModalMedicine.brandName || rejectModalMedicine.medicineName;

    setActionLoadingId(`reject-${medId}`);
    try {
      const res = await api.patch(`/admin/medicines/${medId}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim() || "Inspection criteria not met",
      });
      if (res.data?.success) {
        showToast(`Rejected listing "${medTitle}"`, "info");
        setRejectModalMedicine(null);
        fetchStats();
        fetchMedicines();
      } else {
        showToast(res.data?.message || "Failed to reject medicine", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error rejecting medicine", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Medicine
  const handleDeleteMedicine = async (medId, medTitle) => {
    if (!window.confirm(`Permanently remove listing "${medTitle}" from MEDISAVE?`)) {
      return;
    }

    setActionLoadingId(`delete-${medId}`);
    try {
      const res = await api.delete(`/admin/medicines/${medId}`);
      if (res.data?.success) {
        showToast(`Listing "${medTitle}" deleted permanently`, "info");
        fetchStats();
        fetchMedicines();
      } else {
        showToast(res.data?.message || "Failed to delete medicine", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error deleting medicine", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle User Verification Toggle
  const handleToggleVerification = async (targetUser) => {
    const userId = targetUser._id;
    setActionLoadingId(`verify-${userId}`);
    try {
      const res = await api.patch(`/admin/users/${userId}/verify`, {
        isVerified: !targetUser.isVerified,
      });
      if (res.data?.success) {
        showToast(
          `User ${targetUser.name} marked as ${!targetUser.isVerified ? "Verified" : "Unverified"}`,
          "success"
        );
        fetchUsers();
        fetchStats();
      } else {
        showToast(res.data?.message || "Could not update verification", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error updating user", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Prescription Review Handlers
  const handleViewPrescriptionDoc = async (rx) => {
    const rxId = rx._id || rx.id;
    setPreviewModalPrescription(rx);
    setIsLoadingDoc(true);
    setPreviewBlobUrl(null);

    try {
      const res = await api.get(`/admin/prescriptions/${rxId}/document`, {
        responseType: "blob",
      });
      const mimeType = rx.documentMimeType || res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      let errMsg = "Failed to load prescription document";
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

  const handleOpenApprovePrescriptionModal = (rx) => {
    setApproveModalPrescription(rx);
    setValidityDate("");
  };

  const handleConfirmApprovePrescription = async () => {
    if (!approveModalPrescription) return;
    const rxId = approveModalPrescription._id || approveModalPrescription.id;
    const patient = approveModalPrescription.patientName;

    if (validityDate) {
      const selectedDate = new Date(validityDate);
      if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
        showToast("Prescription validity date must be in the future", "error");
        return;
      }
    }

    setActionLoadingId(`approve-rx-${rxId}`);
    try {
      const payload = {};
      if (validityDate) payload.validUntil = validityDate;

      const res = await api.patch(`/admin/prescriptions/${rxId}/approve`, payload);
      if (res.data?.success) {
        showToast(`Prescription for ${patient} approved successfully`, "success");
        setApproveModalPrescription(null);
        if (previewModalPrescription?._id === rxId) setPreviewModalPrescription(null);
        fetchStats();
        fetchPrescriptions();
      } else {
        showToast(res.data?.message || "Failed to approve prescription", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error approving prescription", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectPrescriptionModal = (rx) => {
    setRejectModalPrescription(rx);
    setPrescriptionRejectionReason("");
  };

  const handleConfirmRejectPrescription = async () => {
    if (!rejectModalPrescription) return;
    const rxId = rejectModalPrescription._id || rejectModalPrescription.id;
    const patient = rejectModalPrescription.patientName;

    if (!prescriptionRejectionReason || !prescriptionRejectionReason.trim()) {
      showToast("Please provide a reason for rejecting the prescription", "error");
      return;
    }

    setActionLoadingId(`reject-rx-${rxId}`);
    try {
      const res = await api.patch(`/admin/prescriptions/${rxId}/reject`, {
        rejectionReason: prescriptionRejectionReason.trim(),
      });
      if (res.data?.success) {
        showToast(`Prescription for ${patient} rejected`, "info");
        setRejectModalPrescription(null);
        if (previewModalPrescription?._id === rxId) setPreviewModalPrescription(null);
        fetchStats();
        fetchPrescriptions();
      } else {
        showToast(res.data?.message || "Failed to reject prescription", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error rejecting prescription", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingMedicines = medicines.filter((m) => m.status === "pending");
  const pendingQueueCount = stats?.medicines?.pending ?? pendingMedicines.length;

  const pendingPrescriptionsList = prescriptions.filter((p) => p.status === "pending");
  const pendingPrescriptionCount =
    stats?.prescriptions?.pending ?? pendingPrescriptionsList.length;
  const pendingPartnerCount =
    partners.filter((p) => p.partnerStatus === "pending").length;

  return (
    <div className="min-h-screen bg-[#f7f7f4] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Coordinator Moderation Console", href: "/admin" },
          ]}
        />

        {/* Admin Header Banner */}
        <div className="bg-white rounded-2xl border border-[#e4e2dd] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f4c42] text-white flex items-center justify-center shadow-xs">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
                  Coordinator Moderation Console
                </h1>
                <Badge variant="verified" size="sm">
                  Administrator
                </Badge>
              </div>
              <p className="text-xs text-[#525252]">
                Logged in as <strong>{user?.name || "Admin"}</strong> ({user?.email}) • Platform
                Quality & Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/dashboard" className="flex-1 sm:flex-none">
              <Button variant="outline" size="md" className="w-full">
                Member Dashboard
              </Button>
            </Link>
            <Link to="/buy" className="flex-1 sm:flex-none">
              <Button variant="outline" size="md" className="w-full">
                Public Catalogue
              </Button>
            </Link>
          </div>
        </div>

        {/* 5 Moderation Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-left">
          <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs bg-amber-50/30">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
              <span>Listing Reviews</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">
              {isLoadingStats ? "..." : stats?.medicines?.pending || 0}
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              Surplus medicine listings
            </span>
          </div>

          <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-xs bg-purple-50/30">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-2">
              <span>Prescription Reviews</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
                <FileTextIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">
              {isLoadingStats ? "..." : stats?.prescriptions?.pending || 0}
            </div>
            <span className="text-[11px] text-purple-800 font-medium">
              Awaiting doctor verification
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Approved Listings</span>
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center">
                <PackageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">
              {isLoadingStats ? "..." : stats?.medicines?.approved || 0}
            </div>
            <span className="text-[11px] text-[#0f4c42] font-medium">Live in public exchange</span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Registered Users</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">
              {isLoadingStats ? "..." : stats?.users?.total || 0}
            </div>
            <span className="text-[11px] text-sky-700 font-medium">
              {stats?.users?.verified || 0} verified members
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Orders Placed</span>
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center">
                <ShoppingBagIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0f4c42]">
              {isLoadingStats ? "..." : stats?.orders?.total || 0}
            </div>
            <span className="text-[11px] text-[#0f4c42] font-medium font-mono">
              ₹{stats?.orders?.turnover || 0} volume
            </span>
          </div>
        </div>

        {/* Tabbed Moderation Center */}
        <div className="bg-white rounded-2xl border border-[#e4e2dd] shadow-xs overflow-hidden text-left">
          {/* Tabs Bar */}
          <div className="flex border-b border-[#e4e2dd] px-6 overflow-x-auto bg-[#fafaf7]">
            <button
              onClick={() => {
                setActiveTab("pending");
                setMedicineStatusFilter("pending");
                fetchMedicines("pending");
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "pending"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              <span>Listing Queue</span>
              {pendingQueueCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-900">
                  {pendingQueueCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("prescriptions");
                setPrescriptionStatusFilter("pending");
                fetchPrescriptions("pending");
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "prescriptions"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              <FileTextIcon className="w-4 h-4 text-purple-700" />
              <span>Prescription Review</span>
              {pendingPrescriptionCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-purple-100 text-purple-900">
                  {pendingPrescriptionCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("medicines");
                setMedicineStatusFilter("all");
                fetchMedicines("all");
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "medicines"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              All Medicines ({stats?.medicines?.total || medicines.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                fetchOrders();
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              Platform Orders ({stats?.orders?.total || orders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("users");
                fetchUsers();
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "users"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              User Management ({stats?.users?.total || users.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("partners");
                fetchPartners();
              }}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "partners"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              <span>Partner Organizations ({partners.length})</span>
              {pendingPartnerCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-900">
                  {pendingPartnerCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: PENDING LISTING QUEUE */}
          {activeTab === "pending" && (
            <div className="p-6">
              {isLoadingMedicines ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : pendingMedicines.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-amber-900">
                    <div className="flex items-center gap-2.5">
                      <AlertCircleIcon className="w-5 h-5 text-amber-700 shrink-0" />
                      <span>
                        <strong>Coordinator Inspection:</strong> Verify intact sealed packaging,
                        legitimate batch stamping, future expiry date (&gt;30 days), and subsidized
                        pricing before approving for public catalog.
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                      <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                        <tr>
                          <th className="py-3 px-4 font-bold">Medicine & Batch</th>
                          <th className="py-3 px-4 font-bold">Donor</th>
                          <th className="py-3 px-4 font-bold">Category & Form</th>
                          <th className="py-3 px-4 font-bold">Expiry Date</th>
                          <th className="py-3 px-4 font-bold">Donation Type</th>
                          <th className="py-3 px-4 font-bold text-right">Moderation Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e4e2dd]">
                        {pendingMedicines.map((med) => {
                          const medId = med._id || med.id;
                          const title = med.brandName || med.medicineName;
                          const isActionLoading =
                            actionLoadingId === `approve-${medId}` ||
                            actionLoadingId === `reject-${medId}`;

                          return (
                            <tr key={medId} className="hover:bg-[#fafaf7] transition">
                              <td className="py-4 px-4 font-semibold text-[#171717]">
                                <div>{title}</div>
                                <div className="text-[11px] text-[#737373] font-normal">
                                  {med.company} • Batch:{" "}
                                  <span className="font-mono">{med.batchNumber || "N/A"}</span>
                                </div>
                                <div className="text-[10px] text-[#525252] font-normal mt-0.5">
                                  Pack: {med.packageCondition || "Intact Sealed"}
                                  {med.isPrescriptionRequired && (
                                    <span className="ml-2 font-bold text-purple-800">
                                      [Rx Required]
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-4 text-[#171717]">
                                <div className="font-semibold">{med.seller?.name || "Member"}</div>
                                <div className="text-[11px] text-[#737373]">
                                  {med.seller?.email} •{" "}
                                  {med.seller?.phone || med.seller?.address?.split(",")[0] || "Pune"}
                                </div>
                              </td>

                              <td className="py-4 px-4 text-xs text-[#525252]">
                                <div>{med.category}</div>
                                <span className="text-[11px] text-[#737373]">
                                  {med.dosageForm} ({med.strength || "Standard"})
                                </span>
                              </td>

                              <td className="py-4 px-4 text-xs font-mono">
                                {med.expiryText ||
                                  (med.expiryDate
                                    ? new Date(med.expiryDate).toLocaleDateString()
                                    : "-")}
                              </td>

                              <td className="py-4 px-4 font-bold text-[#065f46]">
                                <span className="inline-block text-[11px] font-bold bg-[#ecfdf5] text-[#065f46] px-2 py-0.5 rounded border border-[#a7f3d0]">
                                  🎁 Free Donation
                                </span>
                              </td>

                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApproveMedicine(medId, title)}
                                    disabled={isActionLoading}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold"
                                  >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRejectModal(med)}
                                    disabled={isActionLoading}
                                    className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                                  >
                                    <XIcon className="w-3.5 h-3.5" />
                                    Reject
                                  </Button>
                                  <Link
                                    to={`/medicine/${medId}`}
                                    className="text-xs font-semibold text-[#737373] hover:text-[#171717] underline ml-1 cursor-pointer"
                                  >
                                    Inspect
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Queue is completely clear"
                  description="All medicine submissions have been reviewed and approved or rejected. New submissions will appear here automatically."
                />
              )}
            </div>
          )}

          {/* TAB 2: PRESCRIPTION REVIEW */}
          {activeTab === "prescriptions" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {["all", "pending", "approved", "rejected"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setPrescriptionStatusFilter(st);
                        fetchPrescriptions(st, prescriptionSearch);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                        prescriptionStatusFilter === st
                          ? "bg-[#0f4c42] text-white"
                          : "bg-[#fafaf7] text-[#525252] border border-[#e4e2dd] hover:bg-[#f7f7f4]"
                      }`}
                    >
                      {st === "pending" ? "Pending Review" : st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search patient, doctor, salts..."
                    value={prescriptionSearch}
                    onChange={(e) => {
                      setPrescriptionSearch(e.target.value);
                      fetchPrescriptions(prescriptionStatusFilter, e.target.value);
                    }}
                    className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                  />
                </div>
              </div>

              {isLoadingPrescriptions ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-purple-900">
                    <div className="flex items-center gap-2.5">
                      <AlertCircleIcon className="w-5 h-5 text-purple-700 shrink-0" />
                      <span>
                        <strong>Prescription Verification Guidelines:</strong> Inspect patient name,
                        registered doctor credentials (MCI / State Council), verify legible salts and
                        strengths, and set an optional validity period before approving.
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                      <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                        <tr>
                          <th className="py-3 px-4 font-bold">Patient & Recipient</th>
                          <th className="py-3 px-4 font-bold">Doctor & Reg No</th>
                          <th className="py-3 px-4 font-bold">Prescribed Salts & Meds</th>
                          <th className="py-3 px-4 font-bold">Uploaded Document</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e4e2dd]">
                        {prescriptions.map((rx) => {
                          const rxId = rx._id || rx.id;
                          const isActionLoading =
                            actionLoadingId === `approve-rx-${rxId}` ||
                            actionLoadingId === `reject-rx-${rxId}`;

                          const uploadDate = rx.createdAt
                            ? new Date(rx.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-";

                          const fileSizeKb = rx.fileSize
                            ? `${(rx.fileSize / 1024).toFixed(1)} KB`
                            : "N/A";

                          return (
                            <tr key={rxId} className="hover:bg-[#fafaf7] transition">
                              <td className="py-4 px-4 font-semibold text-[#171717]">
                                <div className="text-[#171717] font-bold">{rx.patientName}</div>
                                <div className="text-[11px] text-[#737373] font-normal">
                                  Recipient: {rx.buyer?.name || "Patient Member"}
                                </div>
                                <div className="text-[10px] text-[#737373] font-normal">
                                  {rx.buyer?.email} {rx.buyer?.phone ? `• ${rx.buyer?.phone}` : ""}
                                </div>
                              </td>

                              <td className="py-4 px-4 text-[#171717]">
                                <div className="font-semibold">
                                  {rx.doctorName || "Not specified"}
                                </div>
                                <div className="text-[11px] text-[#737373] font-mono">
                                  Reg: {rx.doctorRegistrationNumber || "N/A"}
                                </div>
                              </td>

                              <td className="py-4 px-4 text-xs text-[#525252] max-w-xs">
                                {rx.prescribedSalts ? (
                                  <div className="text-[#171717] font-medium line-clamp-2">
                                    {rx.prescribedSalts}
                                  </div>
                                ) : (
                                  <span className="text-[#737373] italic">No salts specified</span>
                                )}
                                {rx.medicines && rx.medicines.length > 0 && (
                                  <div className="text-[10px] text-[#0f4c42] mt-1">
                                    Linked:{" "}
                                    {rx.medicines
                                      .map((m) => m.brandName || m.medicineName)
                                      .join(", ")}
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-4 text-xs">
                                <div
                                  className="font-mono text-[#171717] font-medium truncate max-w-[160px]"
                                  title={rx.documentOriginalName}
                                >
                                  {rx.documentOriginalName || "document.pdf"}
                                </div>
                                <div className="text-[11px] text-[#737373]">
                                  {fileSizeKb} • {uploadDate}
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                {rx.status === "approved" && (
                                  <Badge variant="success" size="sm">
                                    Approved
                                  </Badge>
                                )}
                                {rx.status === "pending" && (
                                  <Badge variant="warning" size="sm">
                                    Pending Review
                                  </Badge>
                                )}
                                {rx.status === "rejected" && (
                                  <div>
                                    <Badge variant="danger" size="sm">
                                      Rejected
                                    </Badge>
                                    {rx.rejectionReason && (
                                      <p
                                        className="text-[10px] text-rose-600 mt-0.5 line-clamp-1"
                                        title={rx.rejectionReason}
                                      >
                                        {rx.rejectionReason}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewPrescriptionDoc(rx)}
                                    className="text-[#0f4c42] border-[#c4ded9] hover:bg-[#e8f3f1] text-xs font-semibold cursor-pointer"
                                  >
                                    <FileTextIcon className="w-3.5 h-3.5" />
                                    View File
                                  </Button>
                                  {rx.status === "pending" && (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleOpenApprovePrescriptionModal(rx)}
                                        disabled={isActionLoading}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold cursor-pointer"
                                      >
                                        <CheckIcon className="w-3.5 h-3.5" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenRejectPrescriptionModal(rx)}
                                        disabled={isActionLoading}
                                        className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs cursor-pointer"
                                      >
                                        <XIcon className="w-3.5 h-3.5" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No prescriptions found"
                  description="No prescriptions currently match the selected status filter."
                />
              )}
            </div>
          )}

          {/* TAB 3: ALL MEDICINES */}
          {activeTab === "medicines" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {["all", "pending", "approved", "rejected", "sold"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setMedicineStatusFilter(st);
                        fetchMedicines(st, medicineSearch);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                        medicineStatusFilter === st
                          ? "bg-[#0f4c42] text-white"
                          : "bg-[#fafaf7] text-[#525252] border border-[#e4e2dd] hover:bg-[#f7f7f4]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search medicine or batch..."
                    value={medicineSearch}
                    onChange={(e) => {
                      setMedicineSearch(e.target.value);
                      fetchMedicines(medicineStatusFilter, e.target.value);
                    }}
                    className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                  />
                </div>
              </div>

              {isLoadingMedicines ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : medicines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Medicine</th>
                        <th className="py-3 px-4 font-bold">Donor</th>
                        <th className="py-3 px-4 font-bold">Stock</th>
                        <th className="py-3 px-4 font-bold">Donation Type</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Moderator Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
                      {medicines.map((med) => {
                        const medId = med._id || med.id;
                        const title = med.brandName || med.medicineName;
                        const isActionLoading =
                          actionLoadingId === `approve-${medId}` ||
                          actionLoadingId === `reject-${medId}` ||
                          actionLoadingId === `delete-${medId}`;

                        return (
                          <tr key={medId} className="hover:bg-[#fafaf7] transition">
                            <td className="py-4 px-4 font-semibold text-[#171717]">
                              <div>{title}</div>
                              <div className="text-[11px] text-[#737373] font-normal">
                                {med.company} • {med.category}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-[#171717]">
                              <div className="font-semibold">{med.seller?.name || "Member"}</div>
                              <div className="text-[11px] text-[#737373]">{med.seller?.email}</div>
                            </td>

                            <td className="py-4 px-4 font-mono text-[#171717]">
                              {med.quantity} units
                            </td>

                            <td className="py-4 px-4 font-bold text-[#065f46]">
                              <span className="inline-block text-[11px] font-bold bg-[#ecfdf5] text-[#065f46] px-2 py-0.5 rounded border border-[#a7f3d0]">
                                🎁 Free Donation
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              {med.status === "approved" && (
                                <Badge variant="success" size="sm">
                                  Approved
                                </Badge>
                              )}
                              {med.status === "pending" && (
                                <Badge variant="warning" size="sm">
                                  Pending Review
                                </Badge>
                              )}
                              {med.status === "rejected" && (
                                <Badge variant="danger" size="sm">
                                  Rejected
                                </Badge>
                              )}
                              {med.status === "sold" && (
                                <Badge variant="default" size="sm">
                                  Sold Out
                                </Badge>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {med.status !== "approved" && (
                                  <button
                                    onClick={() => handleApproveMedicine(medId, title)}
                                    disabled={isActionLoading}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                {med.status !== "rejected" && (
                                  <button
                                    onClick={() => handleOpenRejectModal(med)}
                                    disabled={isActionLoading}
                                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMedicine(medId, title)}
                                  disabled={isActionLoading}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer disabled:opacity-50 p-1"
                                  title="Permanently remove"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
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
                  title="No medicines match filter"
                  description="Try adjusting your status filter or search keywords."
                />
              )}
            </div>
          )}

          {/* TAB 4: PLATFORM ORDERS */}
          {activeTab === "orders" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setOrderStatusFilter(st);
                      fetchOrders(st);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      orderStatusFilter === st
                        ? "bg-[#0f4c42] text-white"
                        : "bg-[#fafaf7] text-[#525252] border border-[#e4e2dd] hover:bg-[#f7f7f4]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {isLoadingOrders ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const orderId = order._id;
                    const orderNum = order.orderNumber || `#MED-2026-${orderId.slice(-4).toUpperCase()}`;
                    const orderDate = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently";

                    return (
                      <div
                        key={orderId}
                        className="p-5 rounded-xl border border-[#e4e2dd] bg-[#fafaf7] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e4e2dd] text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            <strong className="text-[#171717]">{orderNum}</strong>
                            <span className="text-[#737373] font-sans">• {orderDate}</span>
                          </div>
                          <div>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "success"
                                  : order.status === "cancelled"
                                  ? "danger"
                                  : order.status === "pending"
                                  ? "warning"
                                  : "brand"
                              }
                              size="sm"
                            >
                              Status: {order.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#525252]">
                          <div>
                            <div className="font-semibold text-[#171717]">
                              Recipient: {order.buyer?.name || order.shippingAddress?.fullName}
                            </div>
                            <div className="text-[11px] text-[#737373]">
                              {order.shippingAddress?.phone} • {order.shippingAddress?.address}, {order.shippingAddress?.city}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-sm font-bold text-[#0f4c42] font-mono">
                              Total: ₹{order.totalAmount}
                            </span>
                            <div className="text-[11px] text-[#737373]">
                              Payment: {order.paymentMethod}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#e4e2dd] text-xs space-y-1">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[#525252] text-[11px]">
                              <span>
                                • {it.brandName || it.medicineName} × {it.quantity}{" "}
                                <span className="text-[#737373]">
                                  (Donor: {it.seller?.name || "Donor"})
                                </span>
                              </span>
                              <span className="font-mono font-semibold text-[#171717]">
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No orders found"
                  description="No orders currently match the selected status."
                />
              )}
            </div>
          )}

          {/* TAB 5: USERS & MEMBERS */}
          {activeTab === "users" && (
            <div className="p-6">
              {isLoadingUsers ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Member Name</th>
                        <th className="py-3 px-4 font-bold">Contact Email / Phone</th>
                        <th className="py-3 px-4 font-bold">Listings / Orders</th>
                        <th className="py-3 px-4 font-bold">Role</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
                      {users.map((u) => {
                        const isActionLoading = actionLoadingId === `verify-${u._id}`;

                        return (
                          <tr key={u._id} className="hover:bg-[#fafaf7] transition">
                            <td className="py-4 px-4 font-semibold text-[#171717]">
                              <div className="flex items-center gap-2.5">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="w-7 h-7 rounded-full object-cover border border-[#e4e2dd]"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#0f4c42] text-white flex items-center justify-center font-bold text-xs">
                                    {u.name?.charAt(0).toUpperCase() || "U"}
                                  </div>
                                )}
                                <div>{u.name}</div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-[#171717]">
                              <div>{u.email}</div>
                              <div className="text-[11px] text-[#737373]">
                                {u.phone || u.address?.split(",")[0] || "Pune, MH"}
                              </div>
                            </td>

                            <td className="py-4 px-4 font-mono text-xs text-[#525252]">
                              {u.listingsCount || 0} listings • {u.ordersCount || 0} orders
                            </td>

                            <td className="py-4 px-4">
                              <Badge variant={u.role === "admin" ? "brand" : "default"} size="sm">
                                {u.role === "admin" ? "Admin" : "Member"}
                              </Badge>
                            </td>

                            <td className="py-4 px-4">
                              {u.isVerified ? (
                                <Badge variant="success" size="sm">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Unverified
                                </Badge>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleVerification(u)}
                                disabled={isActionLoading}
                                className="text-xs"
                              >
                                {isActionLoading
                                  ? "Updating..."
                                  : u.isVerified
                                  ? "Revoke Verify"
                                  : "Verify User"}
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
                  title="No users found"
                  description="No registered members found on the platform."
                />
              )}
            </div>
          )}

          {/* TAB 6: PARTNER ORGANIZATIONS MANAGEMENT */}
          {activeTab === "partners" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {[
                  { id: "all", label: `All (${partners.length})` },
                  { id: "pending", label: `Pending (${partners.filter((p) => p.partnerStatus === "pending").length})` },
                  { id: "verified", label: `Verified (${partners.filter((p) => p.partnerStatus === "verified").length})` },
                  { id: "rejected", label: `Rejected (${partners.filter((p) => p.partnerStatus === "rejected").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setPartnerFilter(f.id);
                      fetchPartners(f.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      partnerFilter === f.id
                        ? "bg-[#0f4c42] text-white"
                        : "bg-[#fafaf7] text-[#525252] border border-[#e4e2dd] hover:bg-[#f7f7f4]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {isLoadingPartners ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : partners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Organization & Rep</th>
                        <th className="py-3 px-4 font-bold">Type</th>
                        <th className="py-3 px-4 font-bold">Locality</th>
                        <th className="py-3 px-4 font-bold">Contact</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
                      {partners.map((p) => {
                        const isActionLoading = actionLoadingId === `partner-${p._id}`;

                        return (
                          <tr key={p._id} className="hover:bg-[#fafaf7] transition">
                            <td className="py-4 px-4 font-semibold text-[#171717]">
                              <div className="font-bold text-sm text-[#0f4c42]">
                                {p.organizationName || p.name}
                              </div>
                              <div className="text-xs text-[#737373] font-normal">
                                Rep: {p.name}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs font-medium text-[#171717]">
                              {p.organizationType || "Charitable Clinic"}
                            </td>

                            <td className="py-4 px-4 text-xs font-medium text-[#525252]">
                              {p.locality || "Pune"}
                            </td>

                            <td className="py-4 px-4 text-xs text-[#171717]">
                              <div>{p.email}</div>
                              <div className="text-[11px] text-[#737373]">{p.phone || "-"}</div>
                            </td>

                            <td className="py-4 px-4">
                              {p.partnerStatus === "verified" && (
                                <Badge variant="success" size="sm">
                                  Verified Partner
                                </Badge>
                              )}
                              {p.partnerStatus === "pending" && (
                                <Badge variant="warning" size="sm">
                                  Pending Review
                                </Badge>
                              )}
                              {p.partnerStatus === "rejected" && (
                                <Badge variant="danger" size="sm">
                                  Rejected
                                </Badge>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {p.partnerStatus !== "verified" && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleModeratePartner(p._id, "verified")}
                                    disabled={isActionLoading}
                                    className="bg-[#0f4c42] hover:bg-[#0a362f] text-xs py-1 px-2.5"
                                  >
                                    Verify
                                  </Button>
                                )}
                                {p.partnerStatus !== "rejected" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleModeratePartner(p._id, "rejected")}
                                    disabled={isActionLoading}
                                    className="text-xs py-1 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                                  >
                                    Reject
                                  </Button>
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
                  title="No partner organizations found"
                  description="No registered clinic, NGO, or healthcare partner accounts match this filter."
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Medicine Modal */}
      <Modal
        isOpen={Boolean(rejectModalMedicine)}
        onClose={() => setRejectModalMedicine(null)}
        title="Reject Medicine Listing"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#525252] leading-relaxed">
            Specify reason for rejecting{" "}
            <strong>
              {rejectModalMedicine?.brandName || rejectModalMedicine?.medicineName}
            </strong>
            . The donor member will see this in their dashboard.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Illegible batch stamping, packaging damaged, or expired packaging..."
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setRejectModalMedicine(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmReject}
              disabled={actionLoadingId !== null}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionLoadingId !== null ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prescription Document Preview Modal */}
      <Modal
        isOpen={Boolean(previewModalPrescription)}
        onClose={() => {
          setPreviewModalPrescription(null);
          if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
          }
        }}
        title={`Prescription Verification: ${previewModalPrescription?.patientName || "Document"}`}
      >
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#fafaf7] border border-[#e4e2dd] rounded-xl text-xs">
            <div>
              <span className="text-[#737373] block">Patient Name</span>
              <strong className="text-[#171717]">{previewModalPrescription?.patientName}</strong>
            </div>
            <div>
              <span className="text-[#737373] block">Doctor & Reg No</span>
              <strong className="text-[#171717]">
                {previewModalPrescription?.doctorName || "Not specified"}{" "}
                {previewModalPrescription?.doctorRegistrationNumber
                  ? `(${previewModalPrescription.doctorRegistrationNumber})`
                  : ""}
              </strong>
            </div>
            {previewModalPrescription?.prescribedSalts && (
              <div className="col-span-2">
                <span className="text-[#737373] block">Prescribed Salts</span>
                <span className="text-[#171717] font-medium">
                  {previewModalPrescription.prescribedSalts}
                </span>
              </div>
            )}
          </div>

          <div className="border border-[#e4e2dd] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[360px] max-h-[500px]">
            {isLoadingDoc ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-[#737373]">Streaming document...</span>
              </div>
            ) : previewBlobUrl ? (
              previewModalPrescription?.documentMimeType?.includes("pdf") ? (
                <iframe
                  src={previewBlobUrl}
                  title="Prescription Document"
                  className="w-full h-[450px] border-none"
                />
              ) : (
                <img
                  src={previewBlobUrl}
                  alt="Prescription Document"
                  className="max-h-[450px] max-w-full object-contain p-2"
                />
              )
            ) : (
              <div className="p-8 text-center text-[#737373] text-xs">
                Unable to preview document.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {previewBlobUrl && (
                <a
                  href={previewBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#0f4c42] hover:underline"
                >
                  Open in New Tab / Fullscreen
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setPreviewModalPrescription(null);
                  if (previewBlobUrl) {
                    URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }
                }}
              >
                Close
              </Button>
              {previewModalPrescription?.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleOpenRejectPrescriptionModal(previewModalPrescription)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenApprovePrescriptionModal(previewModalPrescription)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Prescription Approval Modal */}
      <Modal
        isOpen={Boolean(approveModalPrescription)}
        onClose={() => setApproveModalPrescription(null)}
        title="Approve Prescription Verification"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#525252] leading-relaxed">
            Verify doctor credentials and approve prescription for{" "}
            <strong>{approveModalPrescription?.patientName}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Prescription Validity Expiry (Optional)
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
            <p className="text-[11px] text-[#737373] mt-1">
              Leave blank if standard validity, or choose a specific future expiry date.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setApproveModalPrescription(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmApprovePrescription}
              disabled={actionLoadingId !== null}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {actionLoadingId !== null ? "Approving..." : "Confirm & Approve"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prescription Reject Modal */}
      <Modal
        isOpen={Boolean(rejectModalPrescription)}
        onClose={() => setRejectModalPrescription(null)}
        title="Reject Prescription Document"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#525252] leading-relaxed">
            Specify the clinical or administrative reason for rejecting the prescription for{" "}
            <strong>{rejectModalPrescription?.patientName}</strong>. The patient will see this reason in their dashboard.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              value={prescriptionRejectionReason}
              onChange={(e) => setPrescriptionRejectionReason(e.target.value)}
              placeholder="e.g. Doctor signature missing, registration number unverified, or illegible dosage..."
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setRejectModalPrescription(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmRejectPrescription}
              disabled={actionLoadingId !== null}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionLoadingId !== null ? "Rejecting..." : "Reject Prescription"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
