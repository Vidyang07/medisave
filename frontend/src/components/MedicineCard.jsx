import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
} from "./common/Icons";

export default function MedicineCard({ medicine }) {
  if (!medicine) return null;

  const medId = medicine._id || medicine.id;
  const title = medicine.brandName || medicine.medicineName || medicine.name || "Medicine";
  const generic = medicine.genericName || medicine.medicineName || medicine.name;
  const company = medicine.company || "Verified Manufacturer";
  const strength = medicine.strength || "";
  const dosageForm = medicine.dosageForm || "Tablet";
  const category = medicine.category || "General Health";
  const image = medicine.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  const isPrescriptionRequired = Boolean(medicine.isPrescriptionRequired);
  const quantity = medicine.quantity || 1;
  const unit = medicine.unit || "packs";

  // Handover and Locality Information
  const locality = medicine.locality || medicine.seller?.address || "Pune";
  const handoverPoint = medicine.handoverPoint || locality;
  const proximity = medicine.proximity;

  // Formatted expiry display
  const expiryDisplay = medicine.expiryText || (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "");

  // Proximity tier style helper
  const getProximityBadge = () => {
    if (!proximity || proximity.distanceKm === null) return null;

    if (proximity.tier === "nearby") {
      return (
        <span className="inline-flex items-center gap-1 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
          <MapPinIcon className="w-3 h-3 text-success-line" />
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
      <span className="inline-flex items-center gap-1 bg-warning text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs">
        <MapPinIcon className="w-3 h-3" />
        {proximity.distanceKm} km away
      </span>
    );
  };

  return (
    <div className="group bg-white rounded-xl border border-line hover:border-brand transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-2xs">
      <div>
        {/* Card Header & Product Image */}
        <div className="relative bg-canvas border-b border-line-soft overflow-hidden aspect-16/10">
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
              <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-2xs text-brand text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs border border-brand-line">
                <ShieldCheckIcon className="w-3 h-3 text-brand" />
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
              <span className="inline-flex items-center gap-1 bg-ink/85 backdrop-blur-2xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                <ClockIcon className="w-3 h-3 text-success-line" />
                Exp: {expiryDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 space-y-2 text-left">
          {/* Category & Dosage Tag */}
          <div className="flex items-center justify-between text-[11px] text-ink-subtle">
            <span className="font-bold text-brand uppercase tracking-wider text-[10px]">
              {category}
            </span>
            {dosageForm && (
              <span className="text-ink-subtle">{dosageForm}</span>
            )}
          </div>

          {/* Medicine Title & Generic Name */}
          <div>
            <Link
              to={`/medicine/${medId}`}
              className="font-bold text-ink text-sm sm:text-base leading-snug group-hover:text-brand transition line-clamp-1"
            >
              {title}
            </Link>
            <p className="text-xs text-ink-muted truncate mt-0.5" title={generic}>
              {generic}
            </p>
          </div>

          {/* Manufacturer & Strength */}
          <div className="flex items-center justify-between text-xs text-ink-muted pt-1.5 border-t border-line-soft">
            <span className="truncate max-w-[140px] font-medium">
              {company}
            </span>
            {strength && (
              <span className="font-mono text-[11px] bg-sunken px-1.5 py-0.5 rounded text-ink font-semibold">
                {strength}
              </span>
            )}
          </div>

          {/* Handover Point & Locality */}
          <div className="flex items-start gap-1 text-[11px] text-ink-muted bg-surface-alt p-2 rounded-lg border border-line">
            <MapPinIcon className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-ink block truncate">
                Handover: {handoverPoint}
              </span>
              <span className="text-[10px] text-ink-subtle block truncate">
                Locality: {locality}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: 100% Free Donation Status & Action CTA */}
      <div className="p-3.5 sm:p-4 pt-2.5 border-t border-line-soft bg-surface-alt flex items-center justify-between gap-2">
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-success bg-success-tint px-2 py-0.5 rounded-md inline-block">
            🎁 100% Free Donation
          </span>
          <span className="text-[10px] text-ink-subtle mt-0.5">
            Available: {quantity} {unit}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to={`/medicine/${medId}`}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-strong text-white transition shadow-2xs flex items-center gap-1"
          >
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}