import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import { MapPinIcon } from "./common/Icons";

export default function MedicineCard({ medicine }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  if (!medicine) return null;

  const medId = medicine._id || medicine.id;
  const title = medicine.brandName || medicine.medicineName || medicine.name || "Medicine";
  const generic = medicine.genericName || medicine.medicineName || medicine.name;
  const company = medicine.company || "Standard Manufacturer";
  const strength = medicine.strength || "";
  const dosageForm = medicine.dosageForm || "Tablet";
  const category = medicine.category || "General Health";
  const price = medicine.price !== undefined ? medicine.price : 0;
  const originalMrp = medicine.originalMrp || price;
  const image = medicine.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  const isPrescriptionRequired = Boolean(medicine.isPrescriptionRequired);
  const batchNumber = medicine.batchNumber || "VERIFIED-BATCH";

  // Handover and Locality Information
  const locality = medicine.locality || medicine.seller?.address || "Pune";
  const handoverPoint = medicine.handoverPoint || locality;
  const proximity = medicine.proximity;

  // Formatted expiry display
  const expiryDisplay = medicine.expiryText || (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Unexpired");

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
    showToast(`Added ${title} to order request`, "success");
  };

  // Proximity tier style helper
  const getProximityBadge = () => {
    if (!proximity || proximity.distanceKm === null) return null;

    if (proximity.tier === "nearby") {
      return (
        <span className="stamp-green text-[10px]">
          Nearby · {proximity.distanceKm} km
        </span>
      );
    }
    if (proximity.tier === "extended") {
      return (
        <span className="stamp-foil text-[10px]">
          Local · {proximity.distanceKm} km
        </span>
      );
    }
    return (
      <span className="stamp-box text-[10px] text-[#92400e] border-[#d97706] bg-[#fffbeb]">
        Far · {proximity.distanceKm} km
      </span>
    );
  };

  return (
    <div className={`bg-white border-2 border-[#27272a] flex flex-col justify-between text-left relative ${isPrescriptionRequired ? "rx-stripe-top" : "border-t-2 border-t-[#27272a]"}`}>
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between p-2.5 border-b border-[#d4d4d8] bg-[#f8f7f4] text-xs font-mono">
          <div className="flex items-center gap-1.5">
            {isPrescriptionRequired ? (
              <span className="stamp-rx text-[10px]">Rx Required</span>
            ) : (
              <span className="stamp-box text-[10px]">OTC</span>
            )}
            <span className="text-[#52525b] uppercase text-[10px] truncate max-w-[110px]">
              {category}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {proximity ? getProximityBadge() : (
              <span className="stamp-box text-[10px]">VERIFIED PACK</span>
            )}
          </div>
        </div>

        {/* Thumbnail & Identity */}
        <div className="p-3.5 space-y-2.5">
          <div className="flex gap-3 items-start">
            <div className="w-16 h-16 bg-[#eef1f6] border border-[#27272a] shrink-0 overflow-hidden">
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover grayscale-25 contrast-110"
              />
            </div>
            
            <div className="min-w-0 flex-1 space-y-0.5">
              <Link
                to={`/medicine/${medId}`}
                className="font-heading font-bold text-sm sm:text-base text-[#141416] hover:text-[#166534] block leading-tight truncate"
              >
                {title}
              </Link>
              <p className="text-xs text-[#52525b] font-mono truncate" title={generic}>
                {generic}
              </p>
              <div className="text-[11px] text-[#71737c] font-mono truncate">
                {company} · {dosageForm} {strength && `(${strength})`}
              </div>
            </div>
          </div>

          {/* Stamped Batch & Expiry Strip */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-[#f8f7f4] border border-[#d4d4d8] text-[11px] font-mono">
            <div>
              <span className="text-[9px] text-[#71737c] uppercase block">BATCH CODE</span>
              <span className="font-bold text-[#141416] truncate block">{batchNumber}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#71737c] uppercase block">EXPIRY DATE</span>
              <span className="font-bold text-[#b91c1c] block">{expiryDisplay}</span>
            </div>
          </div>

          {/* Handover Point & Locality in plain Pune copy */}
          <div className="p-2 border border-[#d4d4d8] text-[11px] font-mono space-y-0.5 bg-white">
            <div className="flex items-start gap-1 text-[#141416]">
              <MapPinIcon className="w-3.5 h-3.5 text-[#166534] shrink-0 mt-0.5" />
              <span className="font-bold truncate">{handoverPoint}</span>
            </div>
            <div className="text-[10px] text-[#52525b] pl-4">
              Pune Locality: {locality}
            </div>
          </div>
        </div>
      </div>

      {/* Card Bottom Pricing & Action Docket Bar */}
      <div className="p-3 border-t-2 border-[#27272a] bg-[#f8f7f4] flex items-center justify-between gap-2">
        <div className="font-mono text-left">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-[#141416]">₹{price}</span>
            {originalMrp > price && (
              <span className="text-xs text-[#71737c] line-through">
                ₹{originalMrp}
              </span>
            )}
          </div>
          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-[#166534] block">
              {discountPercent}% below MRP
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleQuickAdd}
            className="px-2.5 py-1.5 bg-[#f0eee7] hover:bg-[#e4e2d8] text-[#141416] border border-[#27272a] text-xs font-mono font-bold cursor-pointer transition"
            title="Add to order request"
          >
            + Request
          </button>
          <Link
            to={`/medicine/${medId}`}
            className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-mono font-bold border border-[#166534] transition"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}