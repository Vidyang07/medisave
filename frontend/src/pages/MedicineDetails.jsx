import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Button } from "../components/common/Button";
import MedicineCard from "../components/MedicineCard";
import {
  ShoppingBagIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  MapPinIcon,
} from "../components/common/Icons";

export default function MedicineDetails() {
  const { id } = useParams();
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();

  const [medicine, setMedicine] = useState(null);
  const [relatedMedicines, setRelatedMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("info"); // 'info', 'seller', 'safety'

  useEffect(() => {
    let isMounted = true;

    api
      .get(`/medicines/${id}`)
      .then((res) => {
        if (isMounted) {
          if (res.data?.success && res.data?.data) {
            const med = res.data.data;
            setMedicine(med);

            // Fetch related medicines in same category
            if (med.category) {
              api
                .get("/medicines", { params: { category: med.category, limit: 4 } })
                .then((relRes) => {
                  if (isMounted && relRes.data?.success) {
                    const filtered = (relRes.data.data || []).filter(
                      (m) => (m._id || m.id) !== (med._id || med.id)
                    );
                    setRelatedMedicines(filtered.slice(0, 4));
                  }
                })
                .catch(() => {});
            }
          } else {
            setError("Medicine not found");
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || "Medicine listing not found in register");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#f8f7f4] flex items-center justify-center py-16 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#166534] border-t-transparent animate-spin"></div>
          <span className="text-xs font-bold text-[#52525b]">
            LOADING SPECIFICATIONS FROM PUNE REGISTER...
          </span>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="min-h-[70vh] bg-[#f8f7f4] flex items-center justify-center px-4 py-16 text-left font-mono">
        <div className="bg-white border-2 border-[#27272a] p-6 max-w-md text-left space-y-3">
          <div className="flex items-center gap-2">
            <span className="stamp-rx text-xs font-bold">404 NOT FOUND</span>
          </div>
          <h2 className="text-base font-bold text-[#141416] font-heading">
            Medicine Listing Not Registered
          </h2>
          <p className="text-xs text-[#52525b] font-sans leading-relaxed">
            The requested medication listing is either archived, already fulfilled, or currently under coordinator moderation.
          </p>
          <div className="pt-2">
            <Link to="/buy">
              <Button variant="primary" size="md">
                Return to Chemist Price Sheet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const medId = medicine._id || medicine.id;
  const title = medicine.brandName || medicine.medicineName || medicine.name || "Medicine";
  const generic = medicine.genericName || medicine.medicineName || medicine.name;
  const price = medicine.price !== undefined ? medicine.price : 0;
  const originalMrp = medicine.originalMrp || price;
  const availableQty = medicine.quantity !== undefined ? medicine.quantity : 1;
  const unit = medicine.unit || "units";
  const image = medicine.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  const sellerName = medicine.seller?.name || "Verified Community Member";
  const sellerLocation = medicine.seller?.address || medicine.seller?.location || "Pune, Maharashtra";
  const expiryDisplay = medicine.expiryText || (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Valid");
  const isRx = Boolean(medicine.isPrescriptionRequired);

  const discountPercent = originalMrp > price
    ? Math.round(((originalMrp - price) / originalMrp) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(
      {
        ...medicine,
        id: medId,
        name: title,
        brandName: title,
        company: medicine.company,
        strength: medicine.strength,
        price,
        originalMrp,
        image,
        isPrescriptionRequired: isRx,
        locality: medicine.locality || "Pune",
        handoverPoint: medicine.handoverPoint || medicine.locality || "Pune Handover Point",
      },
      quantity
    );
    showToast(`Added ${quantity} pack(s) of ${title} to request list`, "success");
  };

  const handleBuyNow = () => {
    addToCart(
      {
        ...medicine,
        id: medId,
        name: title,
        brandName: title,
        company: medicine.company,
        strength: medicine.strength,
        price,
        originalMrp,
        image,
        isPrescriptionRequired: isRx,
        locality: medicine.locality || "Pune",
        handoverPoint: medicine.handoverPoint || medicine.locality || "Pune Handover Point",
      },
      quantity
    );
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] py-6 sm:py-8 text-left font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Chemist Price Sheet", to: "/buy" },
            { label: medicine.category || "General", to: `/buy?category=${encodeURIComponent(medicine.category || "")}` },
            { label: title },
          ]}
        />

        {/* Main Product Showcase Box */}
        <div className={`bg-white border-2 border-[#27272a] overflow-hidden ${isRx ? "rx-stripe-top" : "border-t-2 border-t-[#27272a]"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-7">
            {/* Left Column: Product Photography & Packaging Badges (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative bg-[#f8f7f4] border-2 border-[#27272a] aspect-4/3 overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover grayscale-15 contrast-105"
                />

                {/* Stamped Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                  <span className="stamp-green text-[10px]">PACKAGING VERIFIED</span>
                  {isRx && (
                    <span className="stamp-rx text-[10px]">Schedule H / Rx Required</span>
                  )}
                </div>

                <div className="absolute bottom-2.5 right-2.5">
                  <span className="stamp-box text-[10px] text-[#b91c1c] border-[#b91c1c] bg-white">
                    EXP: {expiryDisplay}
                  </span>
                </div>
              </div>

              {/* Physical Condition Callout Box */}
              <div className="bg-[#f8f7f4] border border-[#27272a] p-3 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-[#141416]">
                  <span className="font-bold text-[11px] uppercase">Condition:</span>
                  <span className="stamp-box text-[10px] text-[#166534] border-[#166534]">
                    {medicine.packageCondition || "Intact Sealed Blister Pack"}
                  </span>
                </div>
                <p className="text-[11px] text-[#52525b] font-sans">
                  Inspected by coordinators. Intact aluminum foil backing with legible manufacturer stamping.
                </p>
              </div>
            </div>

            {/* Right Column: Specification & Purchasing Controls (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 text-left font-mono">
              <div>
                {/* Category & Manufacturer Tag */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="stamp-box text-[10px]">{medicine.category}</span>
                  {medicine.dosageForm && (
                    <span className="text-xs text-[#52525b] font-mono">
                      Formulation: {medicine.dosageForm}
                    </span>
                  )}
                </div>

                {/* Primary Brand Name & Generic Formulation */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading text-[#141416] tracking-tight leading-snug">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm font-mono text-[#52525b] mt-0.5">
                  Salt: <strong className="text-[#141416] font-sans">{generic}</strong>
                </p>
                <p className="text-xs text-[#71737c] font-mono mt-0.5">
                  Manufacturer: {medicine.company}
                </p>

                {/* Pricing & MRP Discount Showcase */}
                <div className="mt-4 p-3.5 bg-[#f0eee7] border-2 border-[#27272a] flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141416]">
                        ₹{price}
                      </span>
                      {originalMrp > price && (
                        <span className="text-xs sm:text-sm text-[#71737c] line-through font-mono">
                          MRP ₹{originalMrp}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#52525b] uppercase block">
                      Deterministic Community Rate
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="text-right">
                      <span className="stamp-green text-xs font-bold">
                        {discountPercent}% OFF MRP
                      </span>
                      <p className="text-[10px] text-[#166534] font-mono font-bold mt-0.5">
                        Save ₹{originalMrp - price} vs Pharmacy MRP
                      </p>
                    </div>
                  )}
                </div>

                {/* Pune Handover Landmark Box */}
                <div className="mt-3 p-3 bg-white border border-[#27272a] space-y-1 text-xs">
                  <div className="font-bold text-[#141416] uppercase text-[11px] flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Designated Pune Handover Point:</span>
                  </div>
                  <div className="text-[#141416] font-bold text-xs pl-4">
                    {medicine.handoverPoint || "Katraj Chowk, near PMT Bus Stop, Pune"}
                  </div>
                  <div className="text-[10px] text-[#52525b] pl-4">
                    Locality: {medicine.locality || "Pune"} {medicine.pinCode ? `(PIN: ${medicine.pinCode})` : ""}
                  </div>
                </div>

                {/* Key Technical Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs font-mono">
                  <div className="p-2 bg-[#f8f7f4] border border-[#d4d4d8]">
                    <span className="text-[#71737c] block text-[10px] uppercase">Strength</span>
                    <strong className="text-[#141416] text-xs truncate block">{medicine.strength || "Standard"}</strong>
                  </div>
                  <div className="p-2 bg-[#f8f7f4] border border-[#d4d4d8]">
                    <span className="text-[#71737c] block text-[10px] uppercase">Batch Number</span>
                    <strong className="text-[#141416] text-xs truncate block">{medicine.batchNumber || "VERIFIED-BATCH"}</strong>
                  </div>
                  <div className="p-2 bg-[#f8f7f4] border border-[#d4d4d8]">
                    <span className="text-[#71737c] block text-[10px] uppercase">Available Stock</span>
                    <strong className="text-[#166534] text-xs block">{availableQty} {unit}</strong>
                  </div>
                </div>

                {/* Storage Instructions Callout */}
                <div className="mt-2.5 p-2 bg-[#f8f7f4] border border-[#d4d4d8] text-[11px] text-[#52525b]">
                  <strong>Storage:</strong> {medicine.storageCondition || "Store in cool, dry place away from sunlight (<25°C)"}
                </div>

                {/* Pricing Policy Rationale */}
                {medicine.pricingRationale && (
                  <div className="mt-2 p-2 bg-[#f0fdf4] border border-[#166534] text-[10px] text-[#166534]">
                    <strong>Policy Rationale:</strong> {medicine.pricingRationale}
                  </div>
                )}
              </div>

              {/* Quantity Picker & Action Buttons */}
              <div className="pt-3 border-t-2 border-[#27272a] space-y-3 font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-[#141416]">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-[#27272a] bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-2.5 py-0.5 text-[#141416] hover:bg-[#e4e4e7] disabled:opacity-40 cursor-pointer"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#141416]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(availableQty, q + 1))}
                      disabled={quantity >= availableQty}
                      className="px-2.5 py-0.5 text-[#141416] hover:bg-[#e4e4e7] disabled:opacity-40 cursor-pointer"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#52525b]">
                    (Max {availableQty} units available)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleAddToCart}
                    className="w-full"
                  >
                    <ShoppingBagIcon className="w-4 h-4" />
                    + Add to Request List
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleBuyNow}
                    className="w-full"
                  >
                    Request Order (₹{price * quantity})
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* In-Depth Information Section */}
          <div className="border-t-2 border-[#27272a] bg-[#f8f7f4]">
            <div className="flex border-b border-[#27272a] px-5 sm:px-7 font-mono text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-2.5 px-4 font-bold border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "info"
                    ? "border-[#166534] text-[#166534] bg-white"
                    : "border-transparent text-[#52525b] hover:text-[#141416]"
                }`}
              >
                Formulation & Details
              </button>
              <button
                onClick={() => setActiveTab("seller")}
                className={`py-2.5 px-4 font-bold border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "seller"
                    ? "border-[#166534] text-[#166534] bg-white"
                    : "border-transparent text-[#52525b] hover:text-[#141416]"
                }`}
              >
                Donor Profile & Locality
              </button>
              <button
                onClick={() => setActiveTab("safety")}
                className={`py-2.5 px-4 font-bold border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "safety"
                    ? "border-[#166534] text-[#166534] bg-white"
                    : "border-transparent text-[#52525b] hover:text-[#141416]"
                }`}
              >
                Safety & Quality Criteria
              </button>
            </div>

            <div className="p-5 sm:p-7 bg-white text-xs text-[#52525b] leading-relaxed">
              {activeTab === "info" && (
                <div className="space-y-3 max-w-3xl text-left">
                  <h3 className="text-sm font-bold font-heading text-[#141416]">
                    Therapeutic & Formulation Details
                  </h3>
                  <p className="font-sans">{medicine.description || "Verified unexpired medication in undamaged sealed blister packaging."}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono">
                    <div className="p-2.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                      <span className="text-[10px] text-[#71737c] block uppercase">Active Chemical Composition:</span>
                      <strong className="text-[#141416] text-xs font-sans">{generic}</strong>
                    </div>
                    <div className="p-2.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                      <span className="text-[10px] text-[#71737c] block uppercase">Manufacturer:</span>
                      <strong className="text-[#141416] text-xs font-sans">{medicine.company}</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seller" && (
                <div className="space-y-3 max-w-3xl text-left font-mono">
                  <h3 className="text-sm font-bold font-heading text-[#141416]">
                    Community Donor Profile
                  </h3>
                  <div className="p-3 bg-[#f8f7f4] border border-[#27272a] flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-[#141416] font-sans block">{sellerName}</strong>
                      <span className="text-xs text-[#52525b]">Location: {sellerLocation}</span>
                    </div>
                    <span className="stamp-green text-[10px]">VERIFIED DONOR</span>
                  </div>
                  <p className="text-xs text-[#52525b] font-sans">
                    Listing verified and cleared for community exchange following coordinator review of packaging and batch details.
                  </p>
                </div>
              )}

              {activeTab === "safety" && (
                <div className="space-y-3 max-w-3xl text-left font-mono">
                  <h3 className="text-sm font-bold font-heading text-[#141416]">
                    MEDISAVE Quality & Handling Standards
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#4b4d52] font-sans">
                    <li className="flex items-start gap-1.5">
                      <CheckIcon className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                      <span><strong>Minimum 90-Day Expiry Window:</strong> All medicines have verified safety buffers remaining.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckIcon className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                      <span><strong>Hermetically Sealed Blister Standard:</strong> Cut strips or opened bottles are strictly rejected.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckIcon className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                      <span><strong>Doctor Prescription Verification:</strong> Schedule H medications require approved doctor prescription.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Medicines Grid */}
        {relatedMedicines.length > 0 && (
          <div className="mt-8 text-left space-y-3">
            <h3 className="text-base font-bold font-heading text-[#141416]">
              Other Medicines in {medicine.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedMedicines.map((item) => (
                <MedicineCard key={item._id || item.id} medicine={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}