/**
 * MEDISAVE AI Medicine Service
 * 
 * Powered by OpenRouter API (supports Gemini, LLaMA, Claude, DeepSeek, GPT).
 * Provides intelligent medicine analysis, automatic active-salt identification,
 * standard packaging quantity estimation, and fair community market pricing calculations.
 */

// Known pharmaceutical knowledge base for rapid instant responses and offline/fallback resilience
const PHARMA_KNOWLEDGE_BASE = {
  dolomide: {
    brandName: "Dolomide",
    genericName: "Paracetamol (500mg) + Domperidone (10mg)",
    company: "Micro Labs Ltd.",
    category: "Pain & Fever",
    dosageForm: "Tablet",
    strength: "500mg / 10mg",
    quantity: 10,
    unit: "10 Tablets (1 strip)",
    originalMrp: 68,
    price: 32,
    discountPercentage: 53,
    isPrescriptionRequired: false,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Stored in cool, dry place (<25°C)",
    description: "Combination analgesic and antiemetic indicated for pain, fever, and migraine accompanied by nausea.",
    pricingExplanation: "Standard retail MRP for a 10-tablet strip of Dolomide is ~₹68. Suggested community price is ₹32 (~53% discount) ensuring affordability.",
  },
  "dolo 650": {
    brandName: "Dolo 650",
    genericName: "Paracetamol IP (650mg)",
    company: "Micro Labs Ltd.",
    category: "Pain & Fever",
    dosageForm: "Tablet",
    strength: "650 mg",
    quantity: 15,
    unit: "15 Tablets (1 strip)",
    originalMrp: 35,
    price: 18,
    discountPercentage: 49,
    isPrescriptionRequired: false,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Protect from moisture and direct light (<25°C)",
    description: "High-strength antipyretic and analgesic for acute fever, headache, body pain, and dental discomfort.",
    pricingExplanation: "Standard MRP for a 15-tablet strip is ~₹35. Community exchange price set at ₹18 (~49% discount).",
  },
  "crocin 500": {
    brandName: "Crocin 500 Advance",
    genericName: "Paracetamol IP (500mg)",
    company: "GlaxoSmithKline (GSK)",
    category: "Pain & Fever",
    dosageForm: "Tablet",
    strength: "500 mg",
    quantity: 15,
    unit: "15 Tablets (1 strip)",
    originalMrp: 48,
    price: 24,
    discountPercentage: 50,
    isPrescriptionRequired: false,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Store in a cool, dry place away from sunlight (<25°C)",
    description: "Fast-acting antipyretic with Optizorb technology for rapid fever reduction and mild to moderate pain relief.",
    pricingExplanation: "Standard retail MRP is ~₹48 for 15 tablets. Suggested resale price is ₹24 (50% discount).",
  },
  "augmentin 625": {
    brandName: "Augmentin 625 Duo",
    genericName: "Amoxicillin (500mg) + Potassium Clavulanate (125mg)",
    company: "GlaxoSmithKline (GSK)",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "625 mg",
    quantity: 10,
    unit: "10 Tablets (1 strip)",
    originalMrp: 220,
    price: 95,
    discountPercentage: 57,
    isPrescriptionRequired: true,
    packageCondition: "Factory Sealed Aluminum Foil Strip",
    storageCondition: "Store below 25°C in a dry place. Protect from moisture.",
    description: "Broad-spectrum penicillin antibiotic with beta-lactamase inhibitor for bacterial respiratory, urinary, and skin infections.",
    pricingExplanation: "Retail MRP for 10 tablets of Augmentin 625 Duo is ~₹220. Recommended community price is ₹95 (~57% savings for patients).",
  },
  "azee 500": {
    brandName: "Azee 500",
    genericName: "Azithromycin Dihydrate IP (500mg)",
    company: "Cipla Ltd.",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500 mg",
    quantity: 5,
    unit: "5 Tablets (1 strip)",
    originalMrp: 135,
    price: 65,
    discountPercentage: 52,
    isPrescriptionRequired: true,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Store in a dry place below 30°C",
    description: "Macrolide antibiotic used to treat bacterial throat, respiratory tract, and skin infections.",
    pricingExplanation: "Standard retail MRP is ~₹135 for 5 tablets. Suggested community price is ₹65 (~52% off).",
  },
  "pan-d": {
    brandName: "Pan-D",
    genericName: "Pantoprazole (40mg) + Domperidone (30mg SR)",
    company: "Alkem Laboratories Ltd.",
    category: "Digestive Health",
    dosageForm: "Capsule",
    strength: "40mg / 30mg",
    quantity: 15,
    unit: "15 Capsules (1 strip)",
    originalMrp: 210,
    price: 98,
    discountPercentage: 53,
    isPrescriptionRequired: true,
    packageCondition: "Intact Sealed Strip",
    storageCondition: "Store below 25°C. Protect from light and moisture.",
    description: "Proton pump inhibitor and prokinetic agent for GERD, acid reflux, and hyperacidity with nausea.",
    pricingExplanation: "Retail MRP for 15 capsules is ~₹210. Suggested community exchange price is ₹98 (53% discount).",
  },
  "telma 40": {
    brandName: "Telma 40",
    genericName: "Telmisartan IP (40mg)",
    company: "Glenmark Pharmaceuticals",
    category: "Cardiovascular & BP",
    dosageForm: "Tablet",
    strength: "40 mg",
    quantity: 15,
    unit: "15 Tablets (1 strip)",
    originalMrp: 160,
    price: 75,
    discountPercentage: 53,
    isPrescriptionRequired: true,
    packageCondition: "Factory Sealed Aluminum Strip",
    storageCondition: "Store protected from moisture at temperature not exceeding 30°C",
    description: "Angiotensin II receptor antagonist prescribed for managing hypertension (high blood pressure) and cardiovascular protection.",
    pricingExplanation: "Market MRP for 15 tablets is ~₹160. Suggested community price is ₹75 (~53% discount).",
  },
  "montair lc": {
    brandName: "Montair LC",
    genericName: "Montelukast Sodium (10mg) + Levocetirizine HCl (5mg)",
    company: "Cipla Ltd.",
    category: "Respiratory",
    dosageForm: "Tablet",
    strength: "10mg / 5mg",
    quantity: 10,
    unit: "10 Tablets (1 strip)",
    originalMrp: 185,
    price: 85,
    discountPercentage: 54,
    isPrescriptionRequired: true,
    packageCondition: "Intact Aluminum Foil",
    storageCondition: "Store below 25°C in a dry place",
    description: "Antiallergic and leukotriene receptor antagonist for allergic rhinitis, asthma symptoms, and chronic sneezing.",
    pricingExplanation: "Standard retail MRP is ~₹185 for 10 tablets. Suggested community price is ₹85 (~54% discount).",
  },
  "shelcal 500": {
    brandName: "Shelcal 500",
    genericName: "Calcium Carbonate (1250mg eq to Calcium 500mg) + Vitamin D3 (250 IU)",
    company: "Torrent Pharmaceuticals",
    category: "Vitamins & Supplements",
    dosageForm: "Tablet",
    strength: "500 mg / 250 IU",
    quantity: 15,
    unit: "15 Tablets (1 strip)",
    originalMrp: 140,
    price: 68,
    discountPercentage: 51,
    isPrescriptionRequired: false,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Store in a cool dry place below 25°C",
    description: "Bone health calcium and Vitamin D3 dietary supplement for joint strength and osteoporosis prevention.",
    pricingExplanation: "Market MRP is ~₹140 for 15 tablets. Suggested resale price is ₹68 (~51% off).",
  },
  "pantocid 40": {
    brandName: "Pantocid 40",
    genericName: "Pantoprazole Sodium IP (40mg)",
    company: "Sun Pharma Laboratories Ltd.",
    category: "Digestive Health",
    dosageForm: "Tablet",
    strength: "40 mg",
    quantity: 15,
    unit: "15 Tablets (1 strip)",
    originalMrp: 170,
    price: 80,
    discountPercentage: 53,
    isPrescriptionRequired: true,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Store below 25°C. Protect from light and moisture.",
    description: "Proton pump inhibitor reducing stomach acid for gastritis, GERD, and peptic ulcer relief.",
    pricingExplanation: "Standard retail MRP is ~₹170 for 15 tablets. Suggested community price is ₹80 (~53% discount).",
  },
};

/**
 * Normalizes string for fuzzy keyword lookup
 */
const normalizeText = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Lookup fallback from known pharmaceutical database
 */
const lookupKnowledgeBase = (title = "") => {
  const normTitle = normalizeText(title);
  if (!normTitle) return null;

  for (const [key, data] of Object.entries(PHARMA_KNOWLEDGE_BASE)) {
    const normKey = normalizeText(key);
    if (normTitle.includes(normKey) || normKey.includes(normTitle)) {
      return { ...data };
    }
  }
  return null;
};

/**
 * Heuristic estimation engine when medicine is not in knowledge base and AI API is unavailable
 */
const estimateHeuristically = (title = "", customQty = null) => {
  const cleanTitle = title.trim();
  const lower = cleanTitle.toLowerCase();

  // Extract strength if present (e.g. 500mg, 650, 10mg)
  const strengthMatch = cleanTitle.match(/\b\d+(\.\d+)?\s*(mg|mcg|gm|g|ml|iu)\b/i) || cleanTitle.match(/\b(500|650|1000|250|100|40|20|10|5)\b/);
  const strength = strengthMatch ? strengthMatch[0].trim() : "Standard Dosage";

  // Determine dosage form
  let dosageForm = "Tablet";
  if (lower.includes("syrup") || lower.includes("liquid") || lower.includes("suspension")) dosageForm = "Syrup";
  else if (lower.includes("cap") || lower.includes("capsule")) dosageForm = "Capsule";
  else if (lower.includes("inhaler") || lower.includes("spray") || lower.includes("rotacap")) dosageForm = "Inhaler";
  else if (lower.includes("injection") || lower.includes("inj") || lower.includes("vial")) dosageForm = "Injection";
  else if (lower.includes("ointment") || lower.includes("gel") || lower.includes("cream")) dosageForm = "Ointment";
  else if (lower.includes("drop") || lower.includes("eye drop") || lower.includes("ear drop")) dosageForm = "Drops";

  // Determine Category
  let category = "Pain & Fever";
  let isPrescriptionRequired = false;

  if (lower.includes("amox") || lower.includes("azith") || lower.includes("cipro") || lower.includes("cefix") || lower.includes("clav") || lower.includes("biotic")) {
    category = "Antibiotics";
    isPrescriptionRequired = true;
  } else if (lower.includes("pantop") || lower.includes("omep") || lower.includes("rabep") || lower.includes("gelusil") || lower.includes("digene") || lower.includes("domper")) {
    category = "Digestive Health";
  } else if (lower.includes("calcium") || lower.includes("vit") || lower.includes("zinc") || lower.includes("iron") || lower.includes("b12") || lower.includes("folic")) {
    category = "Vitamins & Supplements";
  } else if (lower.includes("telmi") || lower.includes("amlod") || lower.includes("aten") || lower.includes("losartan") || lower.includes("statin") || lower.includes("cardio")) {
    category = "Cardiovascular & BP";
    isPrescriptionRequired = true;
  } else if (lower.includes("metformin") || lower.includes("glimepiride") || lower.includes("vildagliptin") || lower.includes("insulin") || lower.includes("sugar")) {
    category = "Diabetes Care";
    isPrescriptionRequired = true;
  } else if (lower.includes("cetiriz") || lower.includes("levo") || lower.includes("allegra") || lower.includes("cough") || lower.includes("cold") || lower.includes("asthalin") || lower.includes("montair")) {
    category = "Respiratory";
  }

  // Standard quantity & unit
  let standardQty = customQty && Number(customQty) > 0 ? Number(customQty) : 10;
  let unit = `${standardQty} Tablets (1 strip)`;
  if (dosageForm === "Capsule") unit = `${standardQty} Capsules (1 strip)`;
  else if (dosageForm === "Syrup") unit = "1 Bottle (100 ml)";
  else if (dosageForm === "Inhaler") unit = "1 Canister (200 MDI)";
  else if (dosageForm === "Drops") unit = "1 Dropper Bottle (10 ml)";
  else if (dosageForm === "Ointment") unit = "1 Tube (20g)";

  // Estimated MRP Calculation (Based on standard Indian retail pricing)
  let baseMrp = 65;
  if (category === "Antibiotics") baseMrp = 140;
  else if (category === "Cardiovascular & BP") baseMrp = 120;
  else if (category === "Diabetes Care") baseMrp = 110;
  else if (category === "Digestive Health") baseMrp = 90;
  else if (category === "Respiratory") baseMrp = 100;
  else if (category === "Vitamins & Supplements") baseMrp = 95;

  // Scale if custom quantity specified
  const scaledMrp = Math.round((baseMrp / 10) * standardQty);
  // Community price at 50% discount
  const suggestedPrice = Math.round(scaledMrp * 0.48);
  const discountPercentage = Math.round(((scaledMrp - suggestedPrice) / scaledMrp) * 100);

  return {
    medicineName: cleanTitle,
    brandName: cleanTitle,
    genericName: `${cleanTitle} Active Formulation (${strength})`,
    company: "Standard Pharmaceutical Manufacturer",
    category,
    dosageForm,
    strength,
    quantity: standardQty,
    unit,
    originalMrp: scaledMrp,
    price: suggestedPrice,
    discountPercentage,
    isPrescriptionRequired,
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Stored in cool, dry place (<25°C)",
    description: `Standard formulation of ${cleanTitle} for community health support. Sealed packaging with batch traceability.`,
    pricingExplanation: `Estimated market MRP benchmark is ~₹${scaledMrp}. Suggested non-profit community price is ₹${suggestedPrice} (${discountPercentage}% discount) for ${standardQty} units.`,
    aiSource: "heuristic_engine",
  };
};

/**
 * Call OpenRouter API with LLM prompt
 */
async function callOpenRouter(title, customQty = null, contextData = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openrouter_api_key_here") {
    return null;
  }

  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";

  const systemPrompt = `You are MEDISAVE's AI Clinical Pharmacist & Market Pricing Engine.
Your role is to analyze medicine names (such as "Dolomide", "Dolo 650", "Augmentin 625", "Pan-D", "Pantocid", "Telma 40", "Azithral 500", etc.) and output structured, accurate Indian pharmaceutical data with realistic MRP (Maximum Retail Price) in INR (₹) and fair discounted community resale price (40% to 60% discount off MRP).

VALID CATEGORIES (choose the single best matching one):
- "Pain & Fever"
- "Antibiotics"
- "Vitamins & Supplements"
- "Allergy & Cold"
- "Digestive Health"
- "Cardiovascular & BP"
- "Respiratory"
- "Diabetes Care"

VALID DOSAGE FORMS:
"Tablet", "Capsule", "Syrup", "Inhaler", "Injection", "Ointment", "Drops", "Other"

STRICT RULES:
1. Return ONLY valid, parseable JSON with NO markdown formatting, NO backticks, and NO conversational filler.
2. Estimate accurate market retail MRP (originalMrp) in INR (₹) for standard Indian packaging.
3. Calculate suggested community price (price) at approximately 45% to 55% of the originalMrp.
4. If the user specifies quantity, calculate originalMrp and price scaled to that quantity. Otherwise, provide standard pack size (e.g. 10 or 15 tablets/capsules).
5. Identify true generic salt names, manufacturer company (e.g., Micro Labs Ltd, Cipla, GSK, Sun Pharma, Alkem, Torrent, Lupin, Dr. Reddy's), strength, storage conditions, and prescription requirement.

Required JSON Structure:
{
  "medicineName": "Dolomide",
  "brandName": "Dolomide",
  "genericName": "Paracetamol (500mg) + Domperidone (10mg)",
  "company": "Micro Labs Ltd.",
  "category": "Pain & Fever",
  "dosageForm": "Tablet",
  "strength": "500mg / 10mg",
  "quantity": 10,
  "unit": "10 Tablets (1 strip)",
  "originalMrp": 68,
  "price": 32,
  "discountPercentage": 53,
  "isPrescriptionRequired": false,
  "packageCondition": "Intact Sealed Blister Pack",
  "storageCondition": "Stored in cool, dry place (<25°C)",
  "description": "Combination analgesic and antiemetic indicated for pain, fever, and headache accompanied by nausea.",
  "pricingExplanation": "Standard MRP for a 10-tablet strip of Dolomide is ~₹68. Community exchange price set at ₹32 (~53% discount)."
}`;

  const userQuery = `Analyze this medicine: "${title}".
Requested quantity: ${customQty ? customQty : "Standard packaging unit"}.
Additional context provided: ${JSON.stringify(contextData)}.
Provide the complete JSON object with realistic market MRP, community discounted price, active generic ingredients, manufacturer, category, packaging unit, and storage details.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://medisave.community",
        "X-Title": "MEDISAVE AI Smart Pricing",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`OpenRouter API responded with status ${response.status}:`, errBody);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    // Clean JSON content if wrapped in markdown code blocks
    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    // Sanitize & normalize fields
    const quantity = Number(parsed.quantity) || (customQty ? Number(customQty) : 10);
    const originalMrp = Number(parsed.originalMrp) || 60;
    const price = Number(parsed.price) || Math.round(originalMrp * 0.5);
    const discountPercentage =
      originalMrp > 0
        ? Math.round(((originalMrp - price) / originalMrp) * 100)
        : 50;

    const company = parsed.company || parsed.manufacturer || "Reputed Pharma";
    const isRx = Boolean(parsed.isPrescriptionRequired ?? parsed.rxRequired);
    const explanation =
      parsed.pricingRationale ||
      parsed.pricingExplanation ||
      `Market MRP: ₹${originalMrp}. Suggested Community Price: ₹${price} (${discountPercentage}% discount).`;

    return {
      medicineName: parsed.medicineName || parsed.brandName || title,
      brandName: parsed.brandName || parsed.medicineName || title,
      genericName: parsed.genericName || "",
      manufacturer: company,
      company,
      category: parsed.category || "Pain & Fever",
      dosageForm: parsed.dosageForm || "Tablet",
      strength: parsed.strength || "",
      quantity,
      unit: parsed.unit || `${quantity} Tablets (1 strip)`,
      originalMrp,
      price,
      pricingRecommendation: price,
      discountPercentage,
      rxRequired: isRx,
      isPrescriptionRequired: isRx,
      packageCondition: parsed.packageCondition || "Intact Sealed Blister Pack",
      storageCondition: parsed.storageCondition || "Stored in cool, dry place (<25°C)",
      description: parsed.description || "",
      pricingRationale: explanation,
      pricingExplanation: explanation,
      aiSource: `openrouter_${model}`,
    };
  } catch (err) {
    clearTimeout(timeout);
    console.error("OpenRouter API call failed or timed out:", err.message);
    return null;
  }
}

/**
 * Main Public Function: Get AI Medicine & Pricing Estimation
 * 
 * Flow:
 * 1. Checks OpenRouter API if configured.
 * 2. If OpenRouter returns successful data, returns it with AI source tag.
 * 3. If OpenRouter fails or is not configured, checks high-accuracy Pharmaceutical Knowledge Base.
 * 4. Otherwise, falls back to heuristic algorithmic estimation.
 * 
 * @param {Object} params
 * @param {string} params.title - Medicine title / name (e.g. "Dolomide", "Dolo 650", "Augmentin")
 * @param {number} [params.quantity] - Desired quantity (optional)
 * @param {Object} [params.contextData] - Existing form fields or user notes
 * @returns {Promise<Object>} Formatted medicine analysis and pricing proposal
 */
export const getAiMedicineEstimation = async ({
  title,
  quantity,
  contextData = {},
}) => {
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new Error("Medicine title or name is required for AI estimation.");
  }

  const cleanTitle = title.trim();
  const customQty = quantity && Number(quantity) > 0 ? Number(quantity) : null;

  // 1. Attempt Live OpenRouter AI Model
  try {
    const aiResult = await callOpenRouter(cleanTitle, customQty, contextData);
    if (aiResult) {
      return {
        success: true,
        source: "openrouter",
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        data: aiResult,
      };
    }
  } catch (e) {
    console.warn("OpenRouter execution failed, utilizing fallback:", e.message);
  }

  // 2. Lookup in Curated Pharma Knowledge Base
  const kbResult = lookupKnowledgeBase(cleanTitle);
  if (kbResult) {
    // If custom quantity requested, adjust MRP and Price proportionally
    if (customQty && customQty !== kbResult.quantity) {
      const ratio = customQty / kbResult.quantity;
      kbResult.quantity = customQty;
      kbResult.originalMrp = Math.round(kbResult.originalMrp * ratio);
      kbResult.price = Math.round(kbResult.price * ratio);
      kbResult.unit = `${customQty} Tablets`;
    }

    return {
      success: true,
      source: "knowledge_base",
      model: "medisave-pharma-v1",
      data: {
        ...kbResult,
        aiSource: "knowledge_base",
      },
    };
  }

  // 3. Heuristic Algorithmic Estimator
  const heuristicResult = estimateHeuristically(cleanTitle, customQty);
  return {
    success: true,
    source: "heuristic",
    model: "medisave-heuristic-v1",
    data: heuristicResult,
  };
};

export default {
  getAiMedicineEstimation,
};
