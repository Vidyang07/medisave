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
import HandoverSlipModal from "../components/HandoverSlipModal";
import {
  PackageIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  FileTextIcon,
  UploadIcon,
  PrinterIcon,
} from "../components/common/Icons";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const currentUser = user || {
    name: "Community Member",
    email: "member@medisave.org",
    address: "Pune, Maharashtra",
    role: "user",
    avatar: "",
  };

  const [activeTab, setActiveTab] = useState("listings"); // 'listings', 'seller-orders', 'orders', 'prescriptions'
  const [listingFilter, setListingFilter] = useState("all");

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

  // Printable Handover Slip State
  const [isDocketOpen, setIsDocketOpen] = useState(false);
  const [docketOrder, setDocketOrder] = useState(null);

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
  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const rejectedCount = listings.filter((l) => l.status === "rejected").length;
  const fulfilledCount = listings.filter((l) => l.status === "sold").length;

  const filteredListings = listings.filter((l) => {
    if (listingFilter === "all") return true;
    return l.status === listingFilter;
  });

  return (
    <div className="min-h-screen bg-[#f7f7f4] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: "Member Dashboard", href: "/dashboard" }]} />

        {/* Dashboard Header Profile Banner */}
        <div className="bg-white rounded-2xl border border-[#e4e2dd] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#e4e2dd] shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#0f4c42] text-white flex items-center justify-center font-extrabold text-2xl shadow-xs">
                {currentUser.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
                  Welcome, {currentUser.name}
                </h1>
                <Badge variant="verified" size="sm">
                  {currentUser.role === "admin" ? "Administrator" : "Verified Member"}
                </Badge>
              </div>
              <p className="text-xs text-[#525252]">
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
                  className="w-full bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold shadow-xs"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-amber-700" />
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
              <UploadIcon className="w-4 h-4 text-[#0f4c42]" />
              Upload Prescription
            </Button>
            <Link to="/sell" className="flex-1 sm:flex-none">
              <Button variant="primary" size="md" className="w-full shadow-xs">
                <PlusIcon className="w-4 h-4" />
                List Medicine
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Active Listings</span>
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center">
                <PackageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">{activeCount}</div>
            <span className="text-[11px] text-[#0f4c42] font-medium">
              Live in public catalogue
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Pending Review</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">{pendingCount}</div>
            <span className="text-[11px] text-amber-800 font-medium">
              Under coordinator inspection
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Incoming Orders</span>
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0f4c42]">{sellerOrders.length}</div>
            <span className="text-[11px] text-[#0f4c42] font-medium">
              Requiring handover fulfillment
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e2dd] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#737373] text-xs font-semibold mb-2">
              <span>Prescriptions</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                <FileTextIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#171717]">{prescriptions.length}</div>
            <span className="text-[11px] text-purple-800 font-medium">
              {prescriptions.filter((p) => p.status === "approved").length} approved records
            </span>
          </div>
        </div>

        {/* Tabbed Activity Center */}
        <div className="bg-white rounded-2xl border border-[#e4e2dd] shadow-xs overflow-hidden text-left">
          {/* Tabs Bar */}
          <div className="flex border-b border-[#e4e2dd] px-6 overflow-x-auto bg-[#fafaf7]">
            <button
              onClick={() => setActiveTab("listings")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "listings"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              My Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab("seller-orders")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "seller-orders"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              Seller Orders ({sellerOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              My Buyer Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "prescriptions"
                  ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                  : "border-transparent text-[#737373] hover:text-[#171717]"
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
          </div>

          {/* TAB 1: MY MEDICINE LISTINGS */}
          {activeTab === "listings" && (
            <div className="p-6 space-y-4">
              {/* Filter Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {[
                  { id: "all", label: `All (${listings.length})` },
                  { id: "approved", label: `Active (${activeCount})` },
                  { id: "pending", label: `Pending (${pendingCount})` },
                  { id: "rejected", label: `Rejected (${rejectedCount})` },
                  { id: "sold", label: `Sold (${fulfilledCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setListingFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      listingFilter === f.id
                        ? "bg-[#0f4c42] text-white"
                        : "bg-[#fafaf7] text-[#525252] border border-[#e4e2dd] hover:bg-[#f7f7f4]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {isLoadingListings ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Medicine Name</th>
                        <th className="py-3 px-4 font-bold">Category</th>
                        <th className="py-3 px-4 font-bold">Price / MRP</th>
                        <th className="py-3 px-4 font-bold">Expiry Date</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
                      {filteredListings.map((item) => {
                        const medId = item._id || item.id;
                        const title = item.brandName || item.medicineName || item.name;
                        const expiryStr =
                          item.expiryText ||
                          (item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-");

                        return (
                          <tr key={medId} className="hover:bg-[#fafaf7] transition">
                            <td className="py-4 px-4 font-semibold text-[#171717]">
                              <div>{title}</div>
                              <div className="text-xs text-[#737373] font-normal">
                                {item.company} {item.strength ? `(${item.strength})` : ""}
                              </div>
                              {item.isPrescriptionRequired && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded">
                                  Rx Required
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-[#525252]">{item.category}</td>
                            <td className="py-4 px-4 font-bold text-[#0f4c42]">
                              ₹{item.price}{" "}
                              {item.originalMrp && item.originalMrp > item.price && (
                                <span className="text-xs text-[#737373] line-through font-normal">
                                  ₹{item.originalMrp}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs font-mono">{expiryStr}</td>
                            <td className="py-4 px-4">
                              {item.status === "approved" && (
                                <Badge variant="success" size="sm">
                                  Active / Approved
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
                                    <p className="text-[10px] text-rose-600 mt-0.5 max-w-xs">
                                      {item.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                              {item.status === "sold" && (
                                <Badge variant="default" size="sm">
                                  Fulfilled / Sold
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  to={`/medicine/${medId}`}
                                  className="text-xs font-semibold text-[#0f4c42] hover:underline cursor-pointer"
                                >
                                  View
                                </Link>
                                <button
                                  onClick={() => handleDeleteListing(medId, title)}
                                  disabled={deletingId === medId}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer disabled:opacity-50"
                                  title="Delete listing"
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
                  title="No medicine listings in this category"
                  description="Have unused, unexpired surplus medicine? List it on MEDISAVE to assist patients in need."
                  actionLabel="List a Medicine"
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
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sellerOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Order Ref</th>
                        <th className="py-3 px-4 font-bold">Buyer Details</th>
                        <th className="py-3 px-4 font-bold">Medicine Requested</th>
                        <th className="py-3 px-4 font-bold">Qty</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Fulfillment Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
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
                              className="hover:bg-[#fafaf7] transition"
                            >
                              <td className="py-4 px-4 font-mono font-bold text-[#171717]">
                                <div>{orderNum}</div>
                                <span className="text-[11px] text-[#737373] font-sans font-normal">
                                  {order.paymentMethod || "Physical Handover"}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-[#171717]">
                                <div className="font-semibold">{buyerName}</div>
                                <div className="text-[11px] text-[#737373]">
                                  {buyerContact ? `${buyerContact} • ` : ""}
                                  {buyerCity}
                                </div>
                              </td>

                              <td className="py-4 px-4 font-semibold text-[#171717]">
                                <div>{medTitle}</div>
                                <div className="text-[11px] text-[#737373] font-normal">
                                  {item.company} {item.strength ? `(${item.strength})` : ""}
                                </div>
                              </td>

                              <td className="py-4 px-4 font-mono text-[#171717]">
                                × {item.quantity}
                              </td>

                              <td className="py-4 px-4 font-bold text-[#0f4c42] font-mono">
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
                                        className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
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
                                        className="text-xs font-semibold bg-amber-700 hover:bg-amber-800"
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
                                        className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
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
                                        className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
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
                                      className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800"
                                    >
                                      {isUpdating ? "Updating..." : "Mark Delivered"}
                                    </Button>
                                  )}

                                  {itemStatus === "delivered" && (
                                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 justify-end">
                                      <CheckIcon className="w-3.5 h-3.5" /> Fulfilled
                                    </span>
                                  )}

                                  {itemStatus === "cancelled" && (
                                    <span className="text-xs text-[#737373] italic">Cancelled</span>
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
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
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
                        className="p-5 rounded-xl border border-[#e4e2dd] bg-[#fafaf7] space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e4e2dd]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#171717] text-sm">
                              {orderNum}
                            </span>
                            <span className="text-xs text-[#737373]">• Placed on {orderDate}</span>
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

                        {/* Order Lifecycle Progress Bar */}
                        {!isCancelled && (
                          <div className="py-2 px-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] mb-1">
                              <span className={currentIdx >= 0 ? "text-[#0f4c42]" : ""}>Placed</span>
                              <span className={currentIdx >= 1 ? "text-[#0f4c42]" : ""}>Confirmed</span>
                              <span className={currentIdx >= 2 ? "text-[#0f4c42]" : ""}>Processing</span>
                              <span className={currentIdx >= 3 ? "text-[#0f4c42]" : ""}>Dispatched</span>
                              <span className={currentIdx >= 4 ? "text-emerald-700 font-bold" : ""}>
                                Delivered
                              </span>
                            </div>
                            <div className="w-full bg-[#e4e2dd] h-2 rounded-full overflow-hidden flex">
                              <div
                                className="bg-[#0f4c42] h-full transition-all duration-300"
                                style={{
                                  width: `${
                                    currentIdx === -1
                                      ? 10
                                      : ((currentIdx + 1) / stages.length) * 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 text-xs">
                          {order.items?.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-[#525252]"
                            >
                              <div>
                                <span className="font-medium text-[#171717]">
                                  {it.brandName || it.medicineName}
                                </span>
                                {it.strength && (
                                  <span className="text-[#737373] ml-1.5 font-mono text-[11px]">
                                    ({it.strength})
                                  </span>
                                )}
                                <span className="text-[#525252] ml-2">× {it.quantity}</span>
                              </div>
                              <span className="font-semibold text-[#171717] font-mono">
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-[#e4e2dd] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div className="space-y-0.5 text-[#525252]">
                            <div>
                              Handover Location:{" "}
                              <strong className="text-[#171717]">
                                {order.shippingAddress?.address}, {order.shippingAddress?.city}
                              </strong>
                            </div>
                            <div className="text-[11px]">
                              Recipient: {order.shippingAddress?.fullName} ({order.shippingAddress?.phone}) • Mode: {order.paymentMethod}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-sm font-bold text-[#166534] font-mono">
                              Total: ₹{order.totalAmount}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDocketOrder(order);
                                setIsDocketOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#f0eee7] hover:bg-[#e4e2d8] text-[#141416] border border-[#27272a] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                              title="Print Handover Docket"
                            >
                              <PrinterIcon className="w-3.5 h-3.5" />
                              <span>Slip</span>
                            </button>
                            {isCancellable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(orderId, orderNum)}
                                disabled={cancellingOrderId === orderId}
                                className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                              >
                                {cancellingOrderId === orderId ? "Cancelling..." : "Cancel"}
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
                  <h2 className="text-base font-bold text-[#171717]">
                    My Uploaded Prescriptions
                  </h2>
                  <p className="text-xs text-[#737373]">
                    Prescriptions verified by coordinators can be used to request Schedule H and Rx
                    medications at checkout.
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
                  <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#525252]">
                    <thead className="text-[11px] uppercase tracking-wider text-[#737373] bg-[#fafaf7] border-b border-[#e4e2dd]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Patient Name</th>
                        <th className="py-3 px-4 font-bold">Doctor & Reg No</th>
                        <th className="py-3 px-4 font-bold">Prescribed Salts</th>
                        <th className="py-3 px-4 font-bold">Uploaded File</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e2dd]">
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
                          <tr key={rxId} className="hover:bg-[#fafaf7] transition">
                            <td className="py-4 px-4 font-semibold text-[#171717]">
                              {rx.patientName}
                            </td>

                            <td className="py-4 px-4 text-[#525252]">
                              <div>{rx.doctorName || "Not specified"}</div>
                              {rx.doctorRegistrationNumber && (
                                <span className="text-[11px] text-[#737373] font-mono">
                                  Reg: {rx.doctorRegistrationNumber}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-xs text-[#525252] max-w-xs truncate">
                              {rx.prescribedSalts || "-"}
                            </td>

                            <td className="py-4 px-4 text-xs text-[#737373]">
                              <div className="font-mono truncate max-w-[150px]">
                                {rx.documentOriginalName || "document.pdf"}
                              </div>
                              <span className="text-[11px] text-[#737373]">{uploadDate}</span>
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
                                    <span className="block text-[10px] text-[#737373] mt-0.5">
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
                                    <p className="text-[10px] text-rose-600 mt-0.5 line-clamp-1">
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
          <p className="text-xs text-[#525252] leading-relaxed">
            Upload an authentic doctor prescription. Community coordinators will inspect patient
            name, registration credentials, and prescribed medications for verification.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Patient Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={rxFormData.patientName}
              onChange={(e) =>
                setRxFormData({ ...rxFormData, patientName: e.target.value })
              }
              placeholder="e.g. Rahul Patil"
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Prescribing Doctor Name
              </label>
              <input
                type="text"
                value={rxFormData.doctorName}
                onChange={(e) =>
                  setRxFormData({ ...rxFormData, doctorName: e.target.value })
                }
                placeholder="e.g. Dr. K. Deshmukh"
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
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
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] font-mono focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Prescribed Generic Salts / Medications
            </label>
            <input
              type="text"
              value={rxFormData.prescribedSalts}
              onChange={(e) =>
                setRxFormData({ ...rxFormData, prescribedSalts: e.target.value })
              }
              placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] text-xs rounded-xl p-3 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Prescription Document File (PDF, JPG, PNG up to 5 MB) <span className="text-rose-600">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              onChange={(e) => setRxFile(e.target.files[0] || null)}
              className="w-full text-xs text-[#525252] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#e8f3f1] file:text-[#0f4c42] hover:file:bg-[#c4ded9] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e4e2dd]">
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
          <div className="p-3 bg-[#fafaf7] border border-[#e4e2dd] rounded-xl text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-[#737373] block">Patient Name</span>
              <strong className="text-[#171717]">{previewRx?.patientName}</strong>
            </div>
            <div>
              <span className="text-[#737373] block">Doctor & Reg</span>
              <strong className="text-[#171717]">
                {previewRx?.doctorName || "Not specified"}{" "}
                {previewRx?.doctorRegistrationNumber
                  ? `(${previewRx.doctorRegistrationNumber})`
                  : ""}
              </strong>
            </div>
            {previewRx?.prescribedSalts && (
              <div className="col-span-2">
                <span className="text-[#737373] block">Prescribed Salts</span>
                <span className="text-[#171717] font-medium">{previewRx.prescribedSalts}</span>
              </div>
            )}
          </div>

          <div className="border border-[#e4e2dd] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[350px] max-h-[480px]">
            {isLoadingDoc ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-[#737373]">Loading secure document...</span>
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
              <div className="p-8 text-center text-[#737373] text-xs">
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
                className="text-xs font-semibold text-[#0f4c42] hover:underline"
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

      {/* Printable Handover Slip Modal */}
      <HandoverSlipModal
        isOpen={isDocketOpen}
        onClose={() => setIsDocketOpen(false)}
        order={docketOrder}
      />
    </div>
  );
}