import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import MedicineCard from "../components/MedicineCard";
import {
  ShieldCheckIcon,
  ClockIcon,
  ShoppingBagIcon,
  PackageIcon,
  AlertCircleIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  FileTextIcon,
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
          setError(err.response?.data?.message || "Medicine listing not found");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#f7f7f4] flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#737373]">
            Loading medicine specifications...
          </span>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="min-h-[70vh] bg-[#f7f7f4] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-xl border border-[#e4e2dd] p-8 max-w-md text-center shadow-2xs">
          <div className="w-12 h-12 bg-[#fff1f2] text-[#be123c] rounded-full flex items-center justify-center mx-auto mb-3.5 border border-[#fecdd3]">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#171717] mb-1.5">
            Medicine Listing Not Found
          </h2>
          <p className="text-xs text-[#525252] mb-5 leading-relaxed">
            The requested medicine listing may have been reserved, fulfilled, or removed from the community catalogue.
          </p>
          <Link to="/buy">
            <Button variant="primary" size="md">
              Browse Available Medicines
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const medId = medicine._id || medicine.id;
  const title = medicine.brandName || medicine.medicineName || medicine.name || "Medicine";
  const generic = medicine.genericName || medicine.medicineName || medicine.name;
  const price = medicine.price !== undefined ? medicine.price : 0;
  const originalMrp = medicine.originalMrp || price;
  const availableQty = medicine.quantity || 1;
  const unit = medicine.unit || "1 pack";
  const image = medicine.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  const sellerName = medicine.seller?.name || "Community Donor";
  const sellerLocation = medicine.seller?.address || medicine.seller?.location || "Pune, Maharashtra";
  const expiryDisplay = medicine.expiryText || (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Valid");

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
        isPrescriptionRequired: Boolean(medicine.isPrescriptionRequired),
      },
      quantity
    );
    showToast(`Added ${quantity} pack(s) of ${title} to cart`, "success");
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
        isPrescriptionRequired: Boolean(medicine.isPrescriptionRequired),
      },
      quantity
    );
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Browse Medicines", to: "/buy" },
            { label: medicine.category || "General", to: `/buy?category=${encodeURIComponent(medicine.category || "")}` },
            { label: title },
          ]}
        />

        {/* Main Product Showcase Box */}
        <div className="bg-white rounded-xl border border-[#e4e2dd] shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8">
            {/* Left Column: Product Photography & Packaging Badges (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-[#f7f7f4] border border-[#e4e2dd] aspect-4/3">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <Badge variant="verified" size="md">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                    Verified Genuine
                  </Badge>
                  {medicine.isPrescriptionRequired && (
                    <Badge variant="prescription" size="sm">
                      Prescription (Rx) Required
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#171717]/85 backdrop-blur-2xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    <ClockIcon className="w-3.5 h-3.5 text-[#a7f3d0]" />
                    Expiry: {expiryDisplay}
                  </span>
                </div>
              </div>

              {/* Physical Condition Callout Box */}
              <div className="bg-[#fafaf7] rounded-lg p-3.5 border border-[#e4e2dd] space-y-1.5 text-xs text-left">
                <div className="flex items-center justify-between text-[#171717] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <PackageIcon className="w-4 h-4 text-[#0f4c42]" />
                    Physical Package Condition:
                  </span>
                  <span className="text-[#065f46] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0]">
                    {medicine.packageCondition || "Intact Sealed Blister Pack"}
                  </span>
                </div>
                <p className="text-[11px] text-[#525252] leading-normal">
                  Inspected to guarantee unpunctured blister foil, undamaged manufacturer labeling, and tamper seal verification.
                </p>
              </div>
            </div>

            {/* Right Column: Specification & Purchasing Controls (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5 text-left">
              <div>
                {/* Category & Manufacturer Tag */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" size="sm">
                    {medicine.category}
                  </Badge>
                  {medicine.dosageForm && (
                    <span className="text-xs text-[#737373] font-medium">
                      • {medicine.dosageForm}
                    </span>
                  )}
                </div>

                {/* Primary Brand Name & Generic Formulation */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#171717] tracking-tight leading-snug">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-[#525252] mt-1">
                  Formula: <span className="text-[#171717] font-semibold">{generic}</span>
                </p>
                <p className="text-xs text-[#737373] mt-0.5">
                  Manufactured by <strong className="text-[#525252]">{medicine.company}</strong>
                </p>

                {/* Pricing & MRP Discount Showcase */}
                <div className="mt-5 p-4 rounded-lg bg-[#e8f3f1] border border-[#c4ded9] flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl sm:text-3xl font-bold text-[#0f4c42]">
                        ₹{price}
                      </span>
                      {originalMrp > price && (
                        <span className="text-xs sm:text-sm text-[#737373] line-through">
                          MRP ₹{originalMrp}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#525252]">
                      MEDISAVE Community Fair Resale Rate
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="text-right">
                      <span className="inline-block bg-[#0f4c42] text-white font-bold text-xs px-2.5 py-1 rounded-md">
                        {discountPercent}% OFF MRP
                      </span>
                      <p className="text-[11px] font-semibold text-[#065f46] mt-0.5">
                        Save ₹{originalMrp - price} vs retail
                      </p>
                    </div>
                  )}
                </div>

                {/* COMMUNITY HANDOVER SPECIFICATION CARD */}
                <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 text-xs text-left">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-950 font-bold flex items-center gap-1.5">
                      <PackageIcon className="w-4 h-4 text-amber-800" />
                      Community Handover Point:
                    </strong>
                    <span className="font-semibold text-[#0f4c42] bg-[#e8f3f1] px-2 py-0.5 rounded border border-[#c4ded9]">
                      {medicine.locality || "Pune"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#525252] bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                    <div>
                      <span className="text-[#737373] block">Preferred Handover:</span>
                      <strong className="text-[#171717]">{medicine.handoverPoint || "Mutually agreed landmark"}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373] block">Locality & PIN:</span>
                      <strong className="text-[#171717]">{medicine.locality || "Pune"} {medicine.pinCode ? `(${medicine.pinCode})` : ""}</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-900/90 leading-relaxed italic border-t border-amber-200/60 pt-1.5">
                    💡 <em>MEDISAVE is designed for community-based handover. Buyers and sellers agree on a convenient handover point. MEDISAVE does not currently operate its own delivery network.</em>
                  </p>
                </div>

                {/* Key Technical Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 text-xs">
                  <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                    <span className="text-[#737373] block text-[11px]">Strength</span>
                    <span className="font-bold text-[#171717] font-mono text-xs">
                      {medicine.strength || "Standard"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                    <span className="text-[#737373] block text-[11px]">Batch Number</span>
                    <span className="font-bold text-[#171717] font-mono text-xs">
                      {medicine.batchNumber || "VERIFIED"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                    <span className="text-[#737373] block text-[11px]">Available Stock</span>
                    <span className="font-bold text-[#065f46] text-xs">
                      {availableQty} {unit}
                    </span>
                  </div>
                </div>

                {/* Storage Instructions Callout */}
                <div className="mt-3.5 flex items-start gap-2 p-2.5 bg-[#f7f7f4] rounded-lg border border-[#e4e2dd] text-xs text-[#525252]">
                  <FileTextIcon className="w-4 h-4 text-[#737373] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#171717]">Storage Guideline:</strong>{" "}
                    {medicine.storageCondition || "Store in cool, dry place away from sunlight (<25°C)"}
                  </div>
                </div>

                {/* Pricing Policy Rationale Callout */}
                {medicine.pricingRationale && (
                  <div className="mt-2.5 p-3 bg-[#f0f9f8] rounded-lg border border-[#c4ded9] text-[11px] text-[#0a362f]">
                    <strong>MEDISAVE Community Pricing Rationale:</strong> {medicine.pricingRationale}
                  </div>
                )}
              </div>

              {/* Quantity Picker & Action Buttons */}
              <div className="pt-4 border-t border-[#e4e2dd] space-y-3.5">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-[#e4e2dd] rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-2.5 py-1 text-[#525252] hover:bg-[#f2f1ec] disabled:opacity-40 transition cursor-pointer"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#171717]">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(availableQty, q + 1))
                      }
                      disabled={quantity >= availableQty}
                      className="px-2.5 py-1 text-[#525252] hover:bg-[#f2f1ec] disabled:opacity-40 transition cursor-pointer"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-[#737373]">
                    (Max {availableQty} packs available)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleAddToCart}
                    className="w-full"
                  >
                    <ShoppingBagIcon className="w-4 h-4" />
                    Add to Request
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBuyNow}
                    className="w-full"
                  >
                    Request Now (₹{price * quantity})
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed In-Depth Information Section */}
          <div className="border-t border-[#e4e2dd] bg-[#fafaf7]">
            {/* Tabs Header */}
            <div className="flex border-b border-[#e4e2dd] px-6 sm:px-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "info"
                    ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                    : "border-transparent text-[#737373] hover:text-[#171717]"
                }`}
              >
                Medicine Information
              </button>
              <button
                onClick={() => setActiveTab("seller")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "seller"
                    ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                    : "border-transparent text-[#737373] hover:text-[#171717]"
                }`}
              >
                Donor & Verification
              </button>
              <button
                onClick={() => setActiveTab("safety")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "safety"
                    ? "border-[#0f4c42] text-[#0f4c42] bg-white"
                    : "border-transparent text-[#737373] hover:text-[#171717]"
                }`}
              >
                Safety Compliance
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 sm:p-8 bg-white text-xs sm:text-sm text-[#525252] leading-relaxed">
              {activeTab === "info" && (
                <div className="space-y-3.5 max-w-3xl text-left">
                  <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                    Therapeutic & Formulation Details
                  </h3>
                  <p>{medicine.description || "Verified unexpired medication in undamaged sealed packaging."}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                      <span className="text-[11px] text-[#737373] block font-medium">Active Ingredients:</span>
                      <span className="font-bold text-[#171717] text-xs">{generic}</span>
                    </div>
                    <div className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                      <span className="text-[11px] text-[#737373] block font-medium">Manufacturer:</span>
                      <span className="font-bold text-[#171717] text-xs">{medicine.company}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seller" && (
                <div className="space-y-3.5 max-w-3xl text-left">
                  <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                    Community Donor Profile
                  </h3>
                  <div className="flex items-center gap-3.5 p-3.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                    <div className="w-10 h-10 rounded-full bg-[#0f4c42] text-[#a7f3d0] flex items-center justify-center font-bold text-sm">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#171717] text-sm">
                          {sellerName}
                        </h4>
                        <Badge variant="verified" size="sm">
                          Verified Donor
                        </Badge>
                      </div>
                      <p className="text-xs text-[#737373] mt-0.5">
                        Location: {sellerLocation}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#737373]">
                    Listing verified and cleared for community exchange following coordinator review of packaging and batch details.
                  </p>
                </div>
              )}

              {activeTab === "safety" && (
                <div className="space-y-3.5 max-w-3xl text-left">
                  <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                    MEDISAVE Quality & Handling Protocols
                  </h3>
                  <ul className="space-y-2 text-xs text-[#525252]">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-[#0f4c42] shrink-0 mt-0.5" />
                      <span><strong>Minimum Expiry Window:</strong> All medicines listed on MEDISAVE have a minimum 90-day safety buffer remaining.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-[#0f4c42] shrink-0 mt-0.5" />
                      <span><strong>Sealed Packaging Standard:</strong> Opened bottles, cut blister packs, and broken tamper seals are strictly rejected.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-[#0f4c42] shrink-0 mt-0.5" />
                      <span><strong>Prescription Verification:</strong> Schedule H and H1 medications require physical or digital doctor prescription approval before checkout.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Medicines Grid */}
        {relatedMedicines.length > 0 && (
          <div className="mt-12 text-left space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-[#171717]">
              Other medicines in {medicine.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
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