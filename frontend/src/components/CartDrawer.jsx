import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import {
  XIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  AlertCircleIcon,
  FileTextIcon,
  UploadIcon,
} from "./common/Icons";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { Modal } from "./common/Modal";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    totalSavings,
    shippingFee,
    grandTotal,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Prescription states
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [prescriptionError, setPrescriptionError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411038",
    handoverType: "public_point",
  });

  const rxItems = items.filter((it) => it.isPrescriptionRequired);
  const requiresPrescription = rxItems.length > 0;

  // Helper to check if a prescription is currently valid and approved
  const isPrescriptionValid = (p) => {
    if (!p || p.status !== "approved") return false;
    if (p.validUntil) {
      const expiry = new Date(p.validUntil);
      if (!isNaN(expiry.getTime()) && expiry <= new Date()) {
        return false;
      }
    }
    return true;
  };

  const fetchUserPrescriptions = async () => {
    if (!isAuthenticated) return;
    setLoadingPrescriptions(true);
    setPrescriptionError(null);
    try {
      const res = await api.get("/prescriptions/my-prescriptions");
      if (res.data?.success) {
        const list = res.data.data || [];
        setPrescriptions(list);

        // Auto-select first approved & valid prescription if available
        const approvedValid = list.find((p) => isPrescriptionValid(p));
        if (approvedValid) {
          setSelectedPrescriptionId(approvedValid._id);
        } else {
          setSelectedPrescriptionId("");
        }
      }
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setPrescriptionError(
        err.response?.data?.message || "Could not load your uploaded prescriptions."
      );
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!isAuthenticated) {
      showToast("Please sign in or create an account to request medicines", "info");
      closeCart();
      navigate("/login");
      return;
    }
    setFormData({
      fullName: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411038",
    });
    setIsCheckoutModalOpen(true);
    if (requiresPrescription) {
      fetchUserPrescriptions();
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please log in to complete your medicine request", "error");
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      showToast("Please fill in all required shipping details", "error");
      return;
    }

    if (requiresPrescription && !selectedPrescriptionId) {
      showToast("An approved prescription is required for this order.", "error");
      return;
    }

    setIsOrdering(true);

    try {
      const orderPayload = {
        items: items.map((item) => ({
          medicineId: item.id || item._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state || "Maharashtra",
          pincode: formData.pincode || "",
        },
        paymentMethod: "Demo / Cash on Delivery (Community Handover)",
        ...(requiresPrescription && selectedPrescriptionId
          ? { prescriptionId: selectedPrescriptionId }
          : {}),
      };

      const res = await api.post("/orders", orderPayload);

      if (res.data?.success && res.data?.data) {
        setConfirmedOrder(res.data.data);
        clearCart();
        setOrderComplete(true);
        showToast("Medicine request placed successfully!", "success");
      } else {
        showToast(res.data?.message || "Could not place order", "error");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "Failed to place order. Please verify items availability and try again.";
      showToast(errMsg, "error");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCloseAll = () => {
    setIsCheckoutModalOpen(false);
    setOrderComplete(false);
    setConfirmedOrder(null);
    closeCart();
  };

  const handleViewDashboardOrders = () => {
    handleCloseAll();
    navigate("/dashboard");
  };

  const handleGoToPrescriptions = () => {
    handleCloseAll();
    navigate("/dashboard");
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171717]/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col border-l border-[#e4e2dd] transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2dd] bg-[#fafaf7]">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-[#0f4c42]" />
            <h2 className="font-bold text-[#171717] text-lg">Requested Medicines</h2>
            <Badge variant="brand" size="sm">
              {itemCount}
            </Badge>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#e4e2dd]/60 transition cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#fafaf7] text-[#737373] border border-[#e4e2dd] flex items-center justify-center mx-auto mb-2">
                <ShoppingBagIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#171717] text-base">
                Your medicine cart is empty
              </h3>
              <p className="text-xs text-[#525252] max-w-xs mx-auto">
                Browse verified, unexpired surplus medicines from community members at discounted rates.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    closeCart();
                    navigate("/buy");
                  }}
                >
                  Browse Medicines
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Prescription notice in cart if Rx items exist */}
              {requiresPrescription && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-purple-900 shadow-xs">
                  <AlertCircleIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Prescription Required</p>
                    <p className="text-[11px] text-purple-800 leading-snug">
                      Your cart contains {rxItems.length} Rx medication(s). An approved doctor
                      prescription is required at checkout.
                    </p>
                  </div>
                </div>
              )}

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3.5 rounded-xl border border-[#e4e2dd] bg-white hover:border-[#0f4c42]/30 transition shadow-xs"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-[#fafaf7] shrink-0 border border-[#e4e2dd]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-[#171717] text-sm truncate">
                        {item.brandName || item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#737373] hover:text-rose-600 transition p-0.5 cursor-pointer"
                        title="Remove item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#525252] truncate">{item.company}</p>
                    {(item.handoverPoint || item.locality) && (
                      <p className="text-[11px] text-[#0f4c42] truncate font-medium mt-0.5">
                        📍 Handover: {item.handoverPoint || item.locality}
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      {item.isPrescriptionRequired && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded uppercase tracking-wider">
                          Rx Required
                        </span>
                      )}
                      {item.expiryText && (
                        <span className="text-xs font-medium text-[#0f4c42] bg-[#e8f3f1] px-1.5 py-0.5 rounded border border-[#c4ded9]">
                          Exp: {item.expiryText}
                        </span>
                      )}
                      {item.strength && (
                        <span className="text-xs text-[#737373] font-mono">
                          {item.strength}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e4e2dd]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#171717] text-sm font-mono">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.originalMrp && (
                          <span className="text-xs text-[#737373] line-through font-mono">
                            ₹{item.originalMrp * item.quantity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center border border-[#e4e2dd] rounded-md overflow-hidden bg-[#fafaf7]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-[#525252] hover:bg-[#e4e2dd] transition cursor-pointer"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#171717] font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-[#525252] hover:bg-[#e4e2dd] transition cursor-pointer"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#e4e2dd] bg-[#fafaf7] space-y-3">
            {totalSavings > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-[#0f4c42] bg-[#e8f3f1] px-3 py-2 rounded-lg border border-[#c4ded9]">
                <span>Community Savings:</span>
                <span>₹{totalSavings} saved</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-[#525252]">
              <div className="flex justify-between">
                <span>Medicine Subtotal:</span>
                <span className="font-medium text-[#171717] font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Handling / Delivery Fee:</span>
                <span className="font-medium text-[#171717]">
                  {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#171717] pt-2 border-t border-[#e4e2dd]">
                <span>Total Payable:</span>
                <span className="text-base text-[#0f4c42] font-mono">₹{grandTotal}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleOpenCheckout}
            >
              Proceed to Request Order
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-[#737373] pt-1">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
              <span>Packaging integrity & batch verification guaranteed</span>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseAll}
        title={orderComplete ? "Order Placed Successfully" : "Complete Medicine Request"}
      >
        {orderComplete ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-[#e8f3f1] text-[#0f4c42] rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#171717]">
              Medicine Request Confirmed!
            </h4>
            <p className="text-sm text-[#525252] leading-relaxed max-w-sm mx-auto">
              Order reference{" "}
              <span className="font-mono font-bold text-[#0f4c42]">
                {confirmedOrder?.orderNumber ||
                  (confirmedOrder?._id
                    ? `#MED-2026-${confirmedOrder._id.slice(-4).toUpperCase()}`
                    : "#MED-2026-CONFIRMED")}
              </span>
              . The donor seller has been notified for pickup verification.
            </p>
            <div className="bg-[#fafaf7] rounded-xl p-4 text-xs text-left text-[#525252] border border-[#e4e2dd] space-y-1.5">
              <p>
                • Recipient:{" "}
                <strong className="text-[#171717]">
                  {confirmedOrder?.shippingAddress?.fullName}
                </strong>
              </p>
              <p>
                • Handover Location:{" "}
                <strong className="text-[#171717]">
                  {confirmedOrder?.shippingAddress?.address},{" "}
                  {confirmedOrder?.shippingAddress?.city}
                </strong>
              </p>
              <p>
                • Total Payable:{" "}
                <strong className="text-[#0f4c42] font-bold">
                  ₹{confirmedOrder?.totalAmount}
                </strong>
              </p>
              <p>
                • Payment Mode:{" "}
                <strong className="text-[#171717]">
                  Cash / UPI on Physical Handover
                </strong>
              </p>
              {confirmedOrder?.prescription && (
                <p>
                  • Prescription:{" "}
                  <strong className="text-[#0f4c42]">
                    Verified ({confirmedOrder.prescription.patientName || "Patient Record"})
                  </strong>
                </p>
              )}
            </div>
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleViewDashboardOrders}
              >
                View My Orders in Dashboard
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleCloseAll}
              >
                Done & Continue Browsing
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4 text-left">
            <div className="bg-[#e8f3f1] border border-[#c4ded9] rounded-xl p-3 text-xs text-[#0a362f] leading-snug">
              <strong>Community Exchange Handover:</strong> Medicines are handed over in-person with
              verified packaging and batch inspection. Payment mode: <strong>Cash / UPI on physical handover</strong>.
            </div>

            {/* Prescription Selection Section */}
            {requiresPrescription && (
              <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <FileTextIcon className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-purple-950">
                      Prescription Verification Required
                    </h5>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      This order contains {rxItems.length} Rx medication(s):{" "}
                      <strong>
                        {rxItems.map((i) => i.brandName || i.name).join(", ")}
                      </strong>
                      . Select an approved prescription to proceed.
                    </p>
                  </div>
                </div>

                {loadingPrescriptions ? (
                  <div className="py-4 text-center text-xs text-[#737373] bg-white rounded-lg border border-purple-100">
                    Loading your verified prescriptions...
                  </div>
                ) : prescriptionError ? (
                  <div className="p-3 text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                    {prescriptionError}
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="p-3 text-xs text-amber-900 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                    <p>
                      <strong>No Prescriptions Found:</strong> You do not have any uploaded
                      prescriptions on your account.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoToPrescriptions}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition cursor-pointer"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      Upload Prescription in Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {prescriptions.map((p) => {
                      const isValidApproved = isPrescriptionValid(p);
                      const isSelected = selectedPrescriptionId === p._id;
                      const isExpired =
                        p.status === "approved" &&
                        p.validUntil &&
                        new Date(p.validUntil) <= new Date();

                      let statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Pending Approval
                        </span>
                      );

                      if (isExpired) {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Expired
                          </span>
                        );
                      } else if (p.status === "approved") {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Approved & Valid
                          </span>
                        );
                      } else if (p.status === "rejected") {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Rejected
                          </span>
                        );
                      }

                      return (
                        <label
                          key={p._id}
                          className={`block p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                            isValidApproved
                              ? isSelected
                              ? "border-[#0f4c42] bg-white ring-2 ring-[#0f4c42]/30 shadow-xs"
                              : "border-[#e4e2dd] bg-white hover:border-[#0f4c42]/50"
                              : "border-[#e4e2dd] bg-[#fafaf7] opacity-75 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="prescriptionSelection"
                              value={p._id}
                              checked={isSelected}
                              disabled={!isValidApproved}
                              onChange={() => {
                                if (isValidApproved) {
                                  setSelectedPrescriptionId(p._id);
                                }
                              }}
                              className="mt-0.5 accent-[#0f4c42]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[#171717] truncate">
                                  Patient: {p.patientName}
                                </span>
                                {statusBadge}
                              </div>

                              <div className="text-[11px] text-[#525252] mt-0.5 space-y-0.5">
                                <p className="truncate">
                                  Doctor: <strong>{p.doctorName || "Prescribing Physician"}</strong>
                                  {p.doctorRegistrationNumber
                                    ? ` (Reg: ${p.doctorRegistrationNumber})`
                                    : ""}
                                </p>
                                {p.prescribedSalts && (
                                  <p className="text-[#737373] truncate">
                                    Salts: {p.prescribedSalts}
                                  </p>
                                )}
                                {p.validUntil && (
                                  <p className="text-[10px] text-[#737373]">
                                    Validity: {new Date(p.validUntil).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              {p.status === "rejected" && p.rejectionReason && (
                                <p className="text-[11px] text-rose-700 font-medium mt-1 bg-rose-50 p-1.5 rounded border border-rose-100">
                                  Rejection reason: {p.rejectionReason}
                                </p>
                              )}

                              {p.status === "pending" && (
                                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                                  Coordinator verification in progress. Cannot be used until approved.
                                </p>
                              )}

                              {isExpired && (
                                <p className="text-[10px] text-rose-700 font-medium mt-0.5">
                                  Prescription expired on {new Date(p.validUntil).toLocaleDateString()}.
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Handover Preference Selector */}
            <div className="p-3 bg-[#f7f7f4] border border-[#e4e2dd] rounded-xl space-y-2">
              <label className="block text-xs font-bold text-[#171717]">
                Community Handover Preference <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    formData.handoverType === "public_point"
                      ? "border-[#0f4c42] bg-[#e8f3f1] text-[#0f4c42] font-semibold"
                      : "border-[#e4e2dd] bg-white text-[#525252]"
                  }`}
                >
                  <input
                    type="radio"
                    name="handoverType"
                    checked={formData.handoverType === "public_point"}
                    onChange={() => setFormData({ ...formData, handoverType: "public_point" })}
                    className="mt-0.5 accent-[#0f4c42]"
                  />
                  <div>
                    <span className="block font-bold text-[#171717]">Agreed Public Point</span>
                    <span className="text-[11px] text-[#525252]">College gate, metro station, landmark</span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    formData.handoverType === "direct_handover"
                      ? "border-[#0f4c42] bg-[#e8f3f1] text-[#0f4c42] font-semibold"
                      : "border-[#e4e2dd] bg-white text-[#525252]"
                  }`}
                >
                  <input
                    type="radio"
                    name="handoverType"
                    checked={formData.handoverType === "direct_handover"}
                    onChange={() => setFormData({ ...formData, handoverType: "direct_handover" })}
                    className="mt-0.5 accent-[#0f4c42]"
                  />
                  <div>
                    <span className="block font-bold text-[#171717]">Nearby Direct Handover</span>
                    <span className="text-[11px] text-[#525252]">Within seller/buyer locality</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Recipient Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="e.g. Dr. Ananya Sharma"
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Contact Phone <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="e.g. +91 98230 45678"
                  className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  City / Locality <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="e.g. Pune"
                  className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Delivery Address / Community Handover Point <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="e.g. Flat 402, Green Meadows, Kothrud, Pune - 411038"
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="411038"
                  className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-sm text-[#171717] focus:ring-2 focus:ring-[#0f4c42] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e4e2dd]">
              <div className="flex justify-between text-xs text-[#525252] mb-1">
                <span>Items ({itemCount}):</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-[#525252] mb-1">
                <span>Handling Fee:</span>
                <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#171717] pt-1">
                <span>Total Amount:</span>
                <span className="text-[#0f4c42] font-mono">₹{grandTotal}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isOrdering}
              disabled={requiresPrescription && !selectedPrescriptionId}
            >
              {requiresPrescription && !selectedPrescriptionId
                ? "Select Approved Prescription to Proceed"
                : `Confirm Request (₹${grandTotal})`}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
