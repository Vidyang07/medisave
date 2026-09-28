/**
 * MEDISAVE Centralized Deterministic Pricing Engine
 * 
 * Rules enforce that:
 * 1. The seller-provided printed MRP is the authoritative base for pricing.
 * 2. Suggested price is calculated deterministically from MRP, packaging condition, and shelf-life window.
 * 3. AI acts solely as a discovery assistant / recommendation helper, not a source of truth.
 * 4. Maximum allowed community listing price is strictly capped at 85% of MRP to enforce non-profit community affordability.
 * 5. Medicines with under 90 days shelf-life are flagged ineligible.
 */

export const PRICING_CONSTANTS = {
  MAX_ALLOWED_PRICE_RATIO: 0.85, // Seller price cannot exceed 85% of original printed MRP
  MIN_EXPIRY_DAYS: 90, // Minimum required shelf life (3 months)
};

/**
 * Returns the condition multiplier based on packaging integrity and months remaining
 * @param {string} packageCondition 
 * @param {number} monthsRemaining 
 * @returns {number} Pricing ratio multiplier (0.20 to 0.65)
 */
function getConditionMultiplier(packageCondition = "", monthsRemaining = 12) {
  const cond = (packageCondition || "").toLowerCase();

  // Tier 1: Intact Sealed Blister / Factory Sealed Strips / Factory Sealed Box
  if (
    cond.includes("sealed blister") ||
    cond.includes("factory sealed") ||
    cond.includes("security seal")
  ) {
    if (monthsRemaining >= 12) return 0.60;
    if (monthsRemaining >= 6) return 0.50;
    return 0.35;
  }

  // Tier 2: Hermetically Sealed Foil / Aluminum Foil Sachet
  if (cond.includes("foil") || cond.includes("sachet") || cond.includes("hermetically")) {
    if (monthsRemaining >= 12) return 0.55;
    if (monthsRemaining >= 6) return 0.45;
    return 0.30;
  }

  // Tier 3: Unopened Bottle with Tamper Ring
  if (cond.includes("bottle") || cond.includes("tamper ring") || cond.includes("liquid")) {
    if (monthsRemaining >= 12) return 0.50;
    if (monthsRemaining >= 6) return 0.40;
    return 0.25;
  }

  // Tier 4: Other / General approved packaging
  if (monthsRemaining >= 12) return 0.45;
  if (monthsRemaining >= 6) return 0.35;
  return 0.20;
}

/**
 * Deterministically calculates suggested community price and audit rationale
 * @param {Object} params
 * @param {number} params.originalMrp - Verified / Printed MRP (₹)
 * @param {string|Date} params.expiryDate - Physical expiry date
 * @param {string} [params.packageCondition] - Physical packaging condition
 * @param {number} [params.quantity] - Number of units / strips (default: 1)
 * @returns {Object} Structured pricing calculation with safety bounds
 */
export function calculateSuggestedPrice({
  originalMrp,
  expiryDate,
  packageCondition = "Intact Sealed Blister Pack",
  quantity = 1,
}) {
  const numMrp = Number(originalMrp);
  const numQty = Number(quantity) > 0 ? Number(quantity) : 1;

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
      ineligibilityReason: "Please provide a valid printed MRP greater than ₹0.",
      pricingRationale: "Printed MRP required for deterministic community price calculation.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);

  if (!expiryDate || isNaN(exp.getTime())) {
    // Default 12 months calculation if expiry date not yet chosen
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

/**
 * Server-side validation for seller-submitted price
 * @param {Object} params
 * @param {number} params.price - Offered community price (₹)
 * @param {number} params.originalMrp - Authoritative printed MRP (₹)
 * @param {string|Date} params.expiryDate - Physical expiry date
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateSubmittedPrice({ price, originalMrp, expiryDate }) {
  const numPrice = Number(price);
  const numMrp = Number(originalMrp);

  if (isNaN(numMrp) || numMrp <= 0) {
    return {
      isValid: false,
      valid: false,
      message: "Printed MRP must be a valid number greater than ₹0.",
      error: "Printed MRP must be a valid number greater than ₹0.",
    };
  }

  if (isNaN(numPrice) || numPrice < 0) {
    return {
      isValid: false,
      valid: false,
      message: "Offered community price cannot be negative.",
      error: "Offered community price cannot be negative.",
    };
  }

  const maxAllowed = Math.round(numMrp * PRICING_CONSTANTS.MAX_ALLOWED_PRICE_RATIO);
  if (numPrice > maxAllowed) {
    const msg = `Offered price (₹${numPrice}) exceeds the MEDISAVE maximum community threshold of ₹${maxAllowed} (85% of printed MRP ₹${numMrp}). Community exchange requires non-profit fair pricing.`;
    return {
      isValid: false,
      valid: false,
      message: msg,
      error: msg,
      maxAllowedPrice: maxAllowed,
    };
  }

  if (expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        isValid: false,
        valid: false,
        message: "Cannot list expired medicines under any circumstances.",
        error: "Cannot list expired medicines under any circumstances.",
      };
    }

    if (diffDays < PRICING_CONSTANTS.MIN_EXPIRY_DAYS) {
      const msg = `Medicine must have at least ${PRICING_CONSTANTS.MIN_EXPIRY_DAYS} days remaining shelf life before expiry (Currently: ${diffDays} days).`;
      return {
        isValid: false,
        valid: false,
        message: msg,
        error: msg,
      };
    }
  }

  return {
    isValid: true,
    valid: true,
  };
}

export default {
  PRICING_CONSTANTS,
  calculateSuggestedPrice,
  validateSubmittedPrice,
};
