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
  ShieldCheckIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  FileTextIcon,
  PrinterIcon,
} from "./common/Icons";
import { Button } from "./common/Button";
import { Modal } from "./common/Modal";
import HandoverSlipModal from "./HandoverSlipModal";

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
  const [isDocketOpen, setIsDocketOpen] = useState(false);

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
      showToast("Please sign in to place a medicine order request.", "info");
      closeCart();
      navigate("/login?redirect=checkout");
      return;
    }

    if (items.length === 0) {
      showToast("Your cart is empty.", "warning");
      return;
    }

    // Refresh user profile default contact details
    setFormData((prev) => ({
      ...prev,
      fullName: user?.name || prev.fullName || "",
      phone: user?.phone || prev.phone || "",
      address: user?.address || prev.address || "",
    }));

    if (requiresPrescription) {
      fetchUserPrescriptions();
    }

    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      showToast("Please fill in all required contact and handover details.", "warning");
      return;
    }

    if (requiresPrescription) {
      if (!selectedPrescriptionId) {
        showToast(
          "Please select a verified, approved doctor prescription for the Rx items in your cart.",
          "error"
        );
        return;
      }

      const chosen = prescriptions.find((p) => p._id === selectedPrescriptionId);
      if (!chosen || chosen.status !== "approved") {
        showToast(
          "Selected prescription is pending or not yet approved by coordinators.",
          "error"
        );
        return;
      }
    }

    setIsOrdering(true);
    try {
      const orderPayload = {
        items: items.map((it) => ({
          medicine: it.id || it._id,
          quantity: it.quantity,
          price: it.price,
          originalMrp: it.originalMrp,
        })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        prescriptionId: requiresPrescription ? selectedPrescriptionId : undefined,
        paymentMethod: "Cash on Delivery",
      };

      const res = await api.post("/orders", orderPayload);
      if (res.data?.success) {
        setConfirmedOrder(res.data.data);
        setOrderComplete(true);
        clearCart();
        showToast("Medicine request placed successfully!", "success");
      } else {
        showToast(res.data?.message || "Failed to create order request.", "error");
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      showToast(
        err.response?.data?.message || "Failed to process order request. Please check required fields.",
        "error"
      );
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

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-[#f8f7f4] z-50 flex flex-col border-l-2 border-[#27272a] transform transition-transform text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#27272a] bg-white">
          <div className="flex items-center gap-2">
            <span className="stamp-box text-[10px]">REQUEST DOCKET</span>
            <h2 className="font-heading font-bold text-[#141416] text-base">
              Medicine Order Request
            </h2>
            <span className="stamp-green text-[10px]">{itemCount} items</span>
          </div>
          <button
            onClick={closeCart}
            className="p-1 text-[#52525b] hover:text-[#141416] hover:bg-[#e4e4e7] border border-[#d4d4d8] cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3 font-mono">
              <div className="w-12 h-12 bg-white text-[#27272a] border-2 border-[#27272a] flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                0
              </div>
              <h3 className="font-bold text-[#141416] text-sm uppercase">
                Medicine request list is empty
              </h3>
              <p className="text-xs text-[#52525b] max-w-xs mx-auto font-sans">
                Browse verified, unexpired surplus medicines from Pune community donors at 40%–65% below MRP.
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
                  Browse Chemist Price Sheet
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Prescription notice in cart if Rx items exist */}
              {requiresPrescription && (
                <div className="bg-[#fef2f2] border-2 border-[#b91c1c] p-3 space-y-1 font-mono text-xs text-[#b91c1c]">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                    <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Prescription Verification Mandate</span>
                  </div>
                  <p className="text-[11px] text-[#7f1d1d] font-sans">
                    Cart contains {rxItems.length} Schedule H item(s). An approved physician prescription is required before checkout fulfillment.
                  </p>
                </div>
              )}

              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border-2 border-[#27272a] bg-white space-y-2 text-xs font-mono ${item.isPrescriptionRequired ? "rx-stripe-left" : "pharmacy-stripe-left"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isPrescriptionRequired ? (
                          <span className="stamp-rx text-[9px]">Rx</span>
                        ) : (
                          <span className="stamp-box text-[9px]">OTC</span>
                        )}
                        <h4 className="font-heading font-bold text-sm text-[#141416] truncate">
                          {item.brandName || item.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#52525b] truncate mt-0.5">{item.company}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#71737c] hover:text-[#b91c1c] p-1 border border-[#d4d4d8] cursor-pointer"
                      title="Remove item"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Batch / Handover Info */}
                  <div className="text-[11px] text-[#52525b] border-t border-[#d4d4d8] pt-1.5 flex items-center justify-between">
                    <span className="truncate max-w-[220px]">
                      📍 {item.handoverPoint || item.locality || "Pune Handover"}
                    </span>
                    {item.expiryText && (
                      <span className="font-bold text-[#b91c1c]">EXP: {item.expiryText}</span>
                    )}
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#d4d4d8]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#141416]">
                        ₹{item.price * item.quantity}
                      </span>
                      {item.originalMrp && (
                        <span className="text-[11px] text-[#71737c] line-through">
                          ₹{item.originalMrp * item.quantity}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center border border-[#27272a] bg-[#f8f7f4]">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 hover:bg-[#e4e4e7] cursor-pointer"
                      >
                        <MinusIcon className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-[#141416] text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 hover:bg-[#e4e4e7] cursor-pointer"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="p-4 border-t-2 border-[#27272a] bg-white space-y-3 font-mono text-xs">
            {totalSavings > 0 && (
              <div className="flex items-center justify-between p-2 bg-[#f0fdf4] border border-[#166534] text-[#166534] font-bold">
                <span>COMMUNITY SAVINGS:</span>
                <span>₹{totalSavings} off MRP</span>
              </div>
            )}

            <div className="space-y-1 text-[#52525b]">
              <div className="flex justify-between">
                <span>Medicine Subtotal:</span>
                <span className="font-bold text-[#141416]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Community Handling Fee:</span>
                <span className="font-bold text-[#141416]">
                  {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#141416] pt-1.5 border-t-2 border-[#27272a]">
                <span>Total Payable:</span>
                <span className="text-[#166534]">₹{grandTotal}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleOpenCheckout}
            >
              Proceed to Request Order
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-[#71737c] font-sans">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#166534]" />
              <span>Inspection on physical pickup guaranteed</span>
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
          <div className="text-left py-2 space-y-4 font-mono text-xs">
            <div className="border-2 border-[#166534] bg-[#f0fdf4] p-3 space-y-1">
              <span className="stamp-green text-[10px]">REQUEST CONFIRMED</span>
              <h4 className="font-heading font-bold text-base text-[#141416]">
                Medicine Handover Request Recorded
              </h4>
              <p className="text-[11px] text-[#166534]">
                Docket Number:{" "}
                <strong>
                  {confirmedOrder?.orderNumber ||
                    (confirmedOrder?._id
                      ? `MS-PUN-${confirmedOrder._id.slice(-6).toUpperCase()}`
                      : "MS-PUN-CONFIRMED")}
                </strong>
              </p>
            </div>

            <div className="border border-[#27272a] p-3 bg-white space-y-1.5">
              <p>• Recipient: <strong>{confirmedOrder?.shippingAddress?.fullName}</strong></p>
              <p>• Handover Location: <strong>{confirmedOrder?.shippingAddress?.address}, {confirmedOrder?.shippingAddress?.city}</strong></p>
              <p>• Total Payable: <strong className="text-[#166534]">₹{confirmedOrder?.totalAmount}</strong></p>
              <p>• Payment Mode: <strong>Cash / UPI upon physical handover</strong></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDocketOpen(true);
                }}
                className="w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-mono font-bold text-xs border border-[#166534] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Print Official Handover Slip / Docket</span>
              </button>

              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={handleViewDashboardOrders}
              >
                View in Member Dashboard
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleCloseAll}
              >
                Close & Return to Price Sheet
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4 text-left font-mono text-xs">
            <div className="bg-[#f8f7f4] border border-[#27272a] p-2.5 text-[11px] text-[#141416]">
              <strong>Pune Community Exchange:</strong> Handover is coordinated in-person at local landmarks. Payment is made directly to the donor upon physical blister inspection.
            </div>

            {/* Prescription Selection Section */}
            {requiresPrescription && (
              <div className="border-2 border-[#b91c1c] bg-[#fef2f2] p-3 space-y-2.5">
                <div className="flex items-start gap-1.5">
                  <FileTextIcon className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-[#b91c1c] uppercase text-[11px]">
                      Doctor Prescription Required (Schedule H)
                    </h5>
                    <p className="text-[10px] text-[#7f1d1d] font-sans">
                      Select a verified, approved prescription for:{" "}
                      <strong>{rxItems.map((i) => i.brandName || i.name).join(", ")}</strong>.
                    </p>
                  </div>
                </div>

                {loadingPrescriptions ? (
                  <div className="py-2 text-center text-[#52525b] bg-white border border-[#d4d4d8]">
                    Loading verified prescriptions...
                  </div>
                ) : prescriptionError ? (
                  <div className="p-2 text-rose-800 bg-rose-50 border border-rose-200">
                    {prescriptionError}
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="p-2 text-[#92400e] bg-amber-50 border border-[#d97706] space-y-1.5">
                    <p><strong>No Prescriptions on File:</strong> Upload a valid prescription to order Schedule H medicines.</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseAll();
                        navigate("/dashboard");
                      }}
                      className="px-2 py-1 bg-[#166534] text-white text-[10px] font-bold"
                    >
                      Go to Dashboard & Upload →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {prescriptions.map((rx) => {
                      const isValid = isPrescriptionValid(rx);
                      return (
                        <label
                          key={rx._id}
                          className={`flex items-start gap-2 p-2 border cursor-pointer ${
                            selectedPrescriptionId === rx._id
                              ? "bg-white border-[#27272a]"
                              : "bg-[#f8f7f4] border-[#d4d4d8]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedRx"
                            value={rx._id}
                            disabled={!isValid}
                            checked={selectedPrescriptionId === rx._id}
                            onChange={() => setSelectedPrescriptionId(rx._id)}
                            className="accent-[#166534] mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#141416]">
                              {rx.patientName} {rx.doctorName && `(Dr. ${rx.doctorName})`}
                            </div>
                            <div className="text-[10px] text-[#52525b]">
                              Status: <strong className={rx.status === "approved" ? "text-[#166534]" : "text-[#b91c1c]"}>{rx.status.toUpperCase()}</strong>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Recipient & Handover Contact Fields */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#141416] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="e.g. Ronit Subhedar"
                  className="w-full bg-white border border-[#27272a] p-1.5 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#141416] mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+91 98230 XXXXX"
                    className="w-full bg-white border border-[#27272a] p-1.5 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#141416] mb-1">
                    Pune Locality *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    placeholder="e.g. Katraj, Pune"
                    className="w-full bg-white border border-[#27272a] p-1.5 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#141416] mb-1">
                  Recipient Address / Preferred Handover Landmark *
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  placeholder="e.g. Near Katraj Chowk PMT Bus Stop, Pune - 411046"
                  className="w-full bg-white border border-[#27272a] p-1.5 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-none"
                />
              </div>
            </div>

            {/* Price Summary in Modal */}
            <div className="p-2.5 bg-[#f8f7f4] border border-[#27272a] flex justify-between items-center text-xs">
              <span>Total Payable at Handover:</span>
              <span className="font-bold text-sm text-[#166534]">₹{grandTotal}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isOrdering}
              disabled={isOrdering || (requiresPrescription && !selectedPrescriptionId)}
            >
              {isOrdering ? "Placing Order..." : "Confirm Medicine Request"}
            </Button>
          </form>
        )}
      </Modal>

      {/* Handover Docket Modal */}
      <HandoverSlipModal
        isOpen={isDocketOpen}
        onClose={() => setIsDocketOpen(false)}
        order={confirmedOrder}
      />
    </>
  );
}
