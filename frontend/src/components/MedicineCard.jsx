import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import {
  ShieldCheckIcon,
  ShoppingBagIcon,
  ClockIcon,
  MapPinIcon,
} from "./common/Icons";

export default function MedicineCard({ medicine }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  if (!medicine) return null;

  const medId = medicine._id || medicine.id;
  const title = medicine.brandName || medicine.medicineName || medicine.name || "Medicine";
  const generic = medicine.genericName || medicine.medicineName || medicine.name;
  const company = medicine.company || "Verified Manufacturer";
  const strength = medicine.strength || "";
  const dosageForm = medicine.dosageForm || "Tablet";
  const category = medicine.category || "General Health";
  const price = medicine.price !== undefined ? medicine.price : 0;
  const originalMrp = medicine.originalMrp || price;
  const image = medicine.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  const isPrescriptionRequired = Boolean(medicine.isPrescriptionRequired);

  // Handover and Locality Information
  const locality = medicine.locality || medicine.seller?.address || "Pune";
  const handoverPoint = medicine.handoverPoint || locality;
  const proximity = medicine.proximity;

  // Formatted expiry display
  const expiryDisplay = medicine.expiryText || (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "");

  const discountPercent = originalMrp > price
    ? Math.round(((originalMrp - price) / originalMrp) * 100)
    : 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        ...medicine,
        id: medId,
        name: title,
        brandName: title,
        company,
        strength,
        price,
        originalMrp,
        image,
        isPrescriptionRequired,
        locality,
        handoverPoint,
      },
      1
    );
    showToast(`Added ${title} to cart`, "success");
  };

  // Proximity tier style helper
  const getProximityBadge = () => {
    if (!proximity || proximity.distanceKm === null) return null;

    if (proximity.tier === "nearby") {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
          <MapPinIcon className="w-3 h-3" />
          Nearby · {proximity.distanceKm} km
        </span>
      );
    }
    if (proximity.tier === "extended") {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-700 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs">
          <MapPinIcon className="w-3 h-3" />
          Extended · {proximity.distanceKm} km
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-amber-700 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs">
        <MapPinIcon className="w-3 h-3" />
        Far from you · {proximity.distanceKm} km
      </span>
    );
  };

  return (
    <div className="group bg-white rounded-xl border border-[#e4e2dd] hover:border-[#0f4c42] transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-2xs">
      <div>
        {/* Card Header & Product Image */}
        <div className="relative bg-[#f7f7f4] border-b border-[#eceae5] overflow-hidden aspect-16/10">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
          />

          {/* Top Floating Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {proximity ? (
              getProximityBadge()
            ) : (
              <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-2xs text-[#0f4c42] text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs border border-[#c4ded9]">
                <ShieldCheckIcon className="w-3 h-3 text-[#0f4c42]" />
                Verified Pack
              </span>
            )}
            {isPrescriptionRequired && (
              <span className="bg-[#5b21b6] text-white text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shadow-2xs">
                Rx Required
              </span>
            )}
          </div>

          {/* Expiry Pill */}
          {expiryDisplay && (
            <div className="absolute bottom-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 bg-[#171717]/85 backdrop-blur-2xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                <ClockIcon className="w-3 h-3 text-[#a7f3d0]" />
                Exp: {expiryDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 space-y-2 text-left">
          {/* Category & Dosage Tag */}
          <div className="flex items-center justify-between text-[11px] text-[#737373]">
            <span className="font-bold text-[#0f4c42] uppercase tracking-wider text-[10px]">
              {category}
            </span>
            {dosageForm && (
              <span className="text-[#737373]">{dosageForm}</span>
            )}
          </div>

          {/* Medicine Title & Generic Name */}
          <div>
            <Link
              to={`/medicine/${medId}`}
              className="font-bold text-[#171717] text-sm sm:text-base leading-snug group-hover:text-[#0f4c42] transition line-clamp-1"
            >
              {title}
            </Link>
            <p className="text-xs text-[#525252] truncate mt-0.5" title={generic}>
              {generic}
            </p>
          </div>

          {/* Manufacturer & Strength */}
          <div className="flex items-center justify-between text-xs text-[#525252] pt-1.5 border-t border-[#eceae5]">
            <span className="truncate max-w-[140px] font-medium">
              {company}
            </span>
            {strength && (
              <span className="font-mono text-[11px] bg-[#f2f1ec] px-1.5 py-0.5 rounded text-[#262626] font-semibold">
                {strength}
              </span>
            )}
          </div>

          {/* Handover Point & Locality */}
          <div className="flex items-start gap-1 text-[11px] text-[#525252] bg-[#fafaf7] p-2 rounded-lg border border-[#e4e2dd]">
            <MapPinIcon className="w-3.5 h-3.5 text-[#0f4c42] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-[#171717] block truncate">
                Handover: {handoverPoint}
              </span>
              <span className="text-[10px] text-[#737373] block truncate">
                Locality: {locality}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing & Action CTA */}
      <div className="p-3.5 sm:p-4 pt-2.5 border-t border-[#eceae5] bg-[#fafaf7] flex items-center justify-between gap-2">
        <div className="flex flex-col text-left">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-[#171717]">₹{price}</span>
            {originalMrp > price && (
              <span className="text-xs text-[#737373] line-through">
                ₹{originalMrp}
              </span>
            )}
          </div>
          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-[#065f46] leading-none">
              Save {discountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleQuickAdd}
            className="p-2 rounded-lg bg-[#e8f3f1] hover:bg-[#d5ebe7] text-[#0f4c42] border border-[#c4ded9] transition cursor-pointer"
            title="Add to cart"
            aria-label="Add to cart"
          >
            <ShoppingBagIcon className="w-4 h-4" />
          </button>
          <Link
            to={`/medicine/${medId}`}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#0f4c42] hover:bg-[#0a362f] text-white transition shadow-2xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}