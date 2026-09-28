/**
 * MEDISAVE Frontend Deterministic Pricing Policy Utility
 */

export const PRICING_CONSTANTS = {
  MAX_ALLOWED_PRICE_RATIO: 0.85,
  MIN_EXPIRY_DAYS: 90,
};

function getConditionMultiplier(packageCondition = "", monthsRemaining = 12) {
  const cond = (packageCondition || "").toLowerCase();

  if (
    cond.includes("sealed blister") ||
    cond.includes("factory sealed") ||
    cond.includes("security seal")
  ) {
    if (monthsRemaining >= 12) return 0.60;
    if (monthsRemaining >= 6) return 0.50;
    return 0.35;
  }

  if (cond.includes("foil") || cond.includes("sachet") || cond.includes("hermetically")) {
    if (monthsRemaining >= 12) return 0.55;
    if (monthsRemaining >= 6) return 0.45;
    return 0.30;
  }

  if (cond.includes("bottle") || cond.includes("tamper ring") || cond.includes("liquid")) {
    if (monthsRemaining >= 12) return 0.50;
    if (monthsRemaining >= 6) return 0.40;
    return 0.25;
  }

  if (monthsRemaining >= 12) return 0.45;
  if (monthsRemaining >= 6) return 0.35;
  return 0.20;
}

export function calculateSuggestedPrice({
  originalMrp,
  expiryDate,
  packageCondition = "Intact Sealed Blister Pack",
}) {
  const numMrp = Number(originalMrp);

  if (isNaN(numMrp) || numMrp <= 0) {
    return {
      isValid: false,
      suggestedPrice: 0,
      originalMrp: 0,
      discountPercentage: 0,
      maxAllowedPrice: 0,
      minAllowedPrice: 0,
      monthsRemaining: 0,
      daysRemaining: 0,
      isEligible: false,
      ineligibilityReason: "Please enter the physical printed MRP on your medicine box/foil.",
      pricingRationale: "Printed MRP required for deterministic community price calculation.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);

  if (!expiryDate || isNaN(exp.getTime())) {
    const ratio = getConditionMultiplier(packageCondition, 12);
    const suggested = Math.max(1, Math.round(numMrp * ratio));
    const maxAllowed = Math.round(numMrp * PRICING_CONSTANTS.MAX_ALLOWED_PRICE_RATIO);
    const discount = Math.round(((numMrp - suggested) / numMrp) * 100);

    return {
      isValid: true,
      suggestedPrice: suggested,
      originalMrp: numMrp,
      discountPercentage: discount,
      maxAllowedPrice: maxAllowed,
      minAllowedPrice: 0,
      monthsRemaining: 12,
      daysRemaining: 365,
      isEligible: true,
      ineligibilityReason: null,
      pricingRationale: `Calculated at ~${Math.round(ratio * 100)}% of printed MRP (₹${numMrp}) for ${packageCondition} under MEDISAVE community exchange policy.`,
    };
  }

  const diffTime = exp.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(0, Math.round(daysRemaining / 30.44));

  if (daysRemaining <= 0) {
    return {
      isValid: false,
      suggestedPrice: 0,
      originalMrp: numMrp,
      discountPercentage: 0,
      maxAllowedPrice: 0,
      minAllowedPrice: 0,
      monthsRemaining: 0,
      daysRemaining,
      isEligible: false,
      ineligibilityReason: "Expired medicines cannot be listed under any circumstances.",
      pricingRationale: "Listing rejected: Medicine is expired.",
    };
  }

  if (daysRemaining < PRICING_CONSTANTS.MIN_EXPIRY_DAYS) {
    return {
      isValid: false,
      suggestedPrice: 0,
      originalMrp: numMrp,
      discountPercentage: 0,
      maxAllowedPrice: 0,
      minAllowedPrice: 0,
      monthsRemaining,
      daysRemaining,
      isEligible: false,
      ineligibilityReason: `Medicine expires in ${daysRemaining} days. MEDISAVE requires at least ${PRICING_CONSTANTS.MIN_EXPIRY_DAYS} days shelf life before listing.`,
      pricingRationale: `Listing restricted: Remaining shelf life (${daysRemaining} days) is below community safety threshold.`,
    };
  }

  const ratio = getConditionMultiplier(packageCondition, monthsRemaining);
  const calculatedPrice = Math.max(1, Math.round(numMrp * ratio));
  const maxAllowed = Math.round(numMrp * PRICING_CONSTANTS.MAX_ALLOWED_PRICE_RATIO);
  const discountPercentage = Math.round(((numMrp - calculatedPrice) / numMrp) * 100);

  const pricingRationale = `Based on ₹${numMrp} printed MRP, ${packageCondition} packaging, and ${monthsRemaining} months remaining shelf life, MEDISAVE suggests ₹${calculatedPrice} (${discountPercentage}% community savings).`;

  return {
    isValid: true,
    suggestedPrice: calculatedPrice,
    originalMrp: numMrp,
    discountPercentage,
    maxAllowedPrice: maxAllowed,
    minAllowedPrice: 0,
    monthsRemaining,
    daysRemaining,
    isEligible: true,
    ineligibilityReason: null,
    pricingRationale,
    conditionMultiplier: ratio,
  };
}

export default {
  PRICING_CONSTANTS,
  calculateSuggestedPrice,
};
