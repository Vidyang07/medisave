import {
  calculateHaversineDistance,
  findLocality,
  getProximityInfo,
  DISTANCE_THRESHOLDS,
  PUNE_LOCALITIES,
} from "../backend/config/localityConstants.js";
import {
  calculateSuggestedPrice,
  validateSubmittedPrice,
  PRICING_CONSTANTS,
} from "../backend/services/pricingService.js";

const API_BASE = "http://localhost:5000/api";

async function runTests() {
  console.log("==================================================");
  console.log("1. TESTING DETERMINISTIC LOCALITY & DISTANCE ENGINE");
  console.log("==================================================");

  // Test 1: Katraj to Hinjewadi Distance
  const katraj = findLocality("Katraj");
  const hinjewadi = findLocality("Hinjewadi");
  const kothrud = findLocality("Kothrud");
  const bibvewadi = findLocality("Bibvewadi");
  const baner = findLocality("Baner");

  console.log(`- Katraj Locality found: ${katraj.name} (${katraj.pinCode}), coords: ${katraj.coordinates.latitude}, ${katraj.coordinates.longitude}`);
  console.log(`- Hinjewadi Locality found: ${hinjewadi.name} (${hinjewadi.pinCode}), coords: ${hinjewadi.coordinates.latitude}, ${hinjewadi.coordinates.longitude}`);

  const distKatrajHinjewadi = calculateHaversineDistance(
    katraj.coordinates.latitude,
    katraj.coordinates.longitude,
    hinjewadi.coordinates.latitude,
    hinjewadi.coordinates.longitude
  );
  console.log(`- Haversine Distance (Katraj -> Hinjewadi): ${distKatrajHinjewadi} km`);
  const proxKatrajHinjewadi = getProximityInfo("Katraj", "Hinjewadi");
  console.log(`- Proximity tier: ${proxKatrajHinjewadi.tier} (${proxKatrajHinjewadi.label})`);

  if (proxKatrajHinjewadi.tier !== "distant" || distKatrajHinjewadi <= 15) {
    throw new Error(`Expected Katraj to Hinjewadi to be >15km and 'distant', got ${distKatrajHinjewadi}km and ${proxKatrajHinjewadi.tier}`);
  }
  console.log("  ✓ Katraj vs Hinjewadi correctly classified as 'Far from you' (>15km)");

  // Test 2: Katraj to Bibvewadi (Nearby)
  const distKatrajBibvewadi = calculateHaversineDistance(
    katraj.coordinates.latitude,
    katraj.coordinates.longitude,
    bibvewadi.coordinates.latitude,
    bibvewadi.coordinates.longitude
  );
  const proxKatrajBibvewadi = getProximityInfo("Katraj", "Bibvewadi");
  console.log(`- Katraj -> Bibvewadi: ${distKatrajBibvewadi} km -> ${proxKatrajBibvewadi.label}`);
  if (proxKatrajBibvewadi.tier !== "nearby") {
    throw new Error(`Expected Katraj to Bibvewadi to be 'nearby', got ${proxKatrajBibvewadi.tier}`);
  }
  console.log("  ✓ Katraj vs Bibvewadi correctly classified as 'Nearby' (<=5km)");

  // Test 3: Kothrud to Baner (Extended area)
  const distKothrudBaner = calculateHaversineDistance(
    kothrud.coordinates.latitude,
    kothrud.coordinates.longitude,
    baner.coordinates.latitude,
    baner.coordinates.longitude
  );
  const proxKothrudBaner = getProximityInfo("Kothrud", "Baner");
  console.log(`- Kothrud -> Baner: ${distKothrudBaner} km -> ${proxKothrudBaner.label}`);
  if (proxKothrudBaner.tier !== "extended") {
    throw new Error(`Expected Kothrud to Baner to be 'extended', got ${proxKothrudBaner.tier}`);
  }
  console.log("  ✓ Kothrud vs Baner correctly classified as 'Extended area' (5-15km)");

  console.log("\n==================================================");
  console.log("2. TESTING DETERMINISTIC PRICING POLICY & FORMULAS");
  console.log("==================================================");

  // Future expiry dates
  const future14Mo = new Date();
  future14Mo.setMonth(future14Mo.getMonth() + 14);

  const future8Mo = new Date();
  future8Mo.setMonth(future8Mo.getMonth() + 8);

  const future4Mo = new Date();
  future4Mo.setMonth(future4Mo.getMonth() + 4);

  const future1Mo = new Date();
  future1Mo.setMonth(future1Mo.getMonth() + 1); // <90 days

  // Case A: Sealed + 14 months (>12 months) -> ~60% of MRP
  const priceCaseA = calculateSuggestedPrice({
    originalMrp: 100,
    packageCondition: "Intact Sealed Blister Pack",
    expiryDate: future14Mo,
  });
  console.log("- Case A (>12 mo, Sealed Blister, MRP ₹100):", priceCaseA);
  if (priceCaseA.suggestedPrice !== 60) {
    throw new Error(`Expected suggested price to be 60, got ${priceCaseA.suggestedPrice}`);
  }
  console.log("  ✓ Case A suggested price = ₹60 (60% of MRP)");

  // Case B: Sealed + 8 months (6-12 months) -> ~50% of MRP
  const priceCaseB = calculateSuggestedPrice({
    originalMrp: 100,
    packageCondition: "Intact Sealed Blister Pack",
    expiryDate: future8Mo,
  });
  console.log("- Case B (6-12 mo, Sealed Blister, MRP ₹100):", priceCaseB);
  if (priceCaseB.suggestedPrice !== 50) {
    throw new Error(`Expected suggested price to be 50, got ${priceCaseB.suggestedPrice}`);
  }
  console.log("  ✓ Case B suggested price = ₹50 (50% of MRP)");

  // Case C: Sealed + 4 months (3-6 months) -> ~35% of MRP
  const priceCaseC = calculateSuggestedPrice({
    originalMrp: 100,
    packageCondition: "Intact Sealed Blister Pack",
    expiryDate: future4Mo,
  });
  console.log("- Case C (3-6 mo, Sealed Blister, MRP ₹100):", priceCaseC);
  if (priceCaseC.suggestedPrice !== 35) {
    throw new Error(`Expected suggested price to be 35, got ${priceCaseC.suggestedPrice}`);
  }
  console.log("  ✓ Case C suggested price = ₹35 (35% of MRP)");

  // Case D: Near expiry (<90 days) -> Ineligible
  const priceCaseD = calculateSuggestedPrice({
    originalMrp: 100,
    packageCondition: "Intact Sealed Blister Pack",
    expiryDate: future1Mo,
  });
  console.log("- Case D (<90 days, MRP ₹100): isEligible =", priceCaseD.isEligible, "reason =", priceCaseD.ineligibilityReason);
  if (priceCaseD.isEligible !== false) {
    throw new Error("Expected near-expiry medicine (<90 days) to be ineligible");
  }
  console.log("  ✓ Case D correctly marked as ineligible due to <90 days shelf life");

  // Validation: Exceeding 85% MRP cap
  const valOverpriced = validateSubmittedPrice({
    price: 90,
    originalMrp: 100,
    expiryDate: future14Mo,
  });
  console.log("- Validation for ₹90 on ₹100 MRP (exceeds 85% cap):", valOverpriced);
  if (valOverpriced.valid !== false) {
    throw new Error("Expected price >85% of MRP to be invalid");
  }
  console.log("  ✓ Overpriced listing correctly rejected by backend validation");

  console.log("\n==================================================");
  console.log("3. TESTING LIVE BACKEND ENDPOINTS");
  console.log("==================================================");

  // 1. Calculate pricing endpoint
  const calcResponse = await fetch(`${API_BASE}/medicines/calculate-pricing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalMrp: 150,
      packageCondition: "Intact Sealed Blister Pack",
      expiryDate: future14Mo.toISOString(),
    }),
  });
  const calcData = await calcResponse.json();
  console.log("- API POST /api/medicines/calculate-pricing status:", calcResponse.status);
  console.log("  Response data:", calcData.data);
  if (!calcData.success || calcData.data.suggestedPrice !== 90) {
    throw new Error(`Expected suggested price ₹90 (60% of 150), got ${calcData.data?.suggestedPrice}`);
  }
  console.log("  ✓ Calculate pricing API returns deterministic calculation: ₹90");

  // 2. AI suggest endpoint with OpenRouter / Knowledge fallback
  const aiResponse = await fetch(`${API_BASE}/medicines/ai-suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Dolomide",
      quantity: 10,
    }),
  });
  const aiData = await aiResponse.json();
  console.log("- API POST /api/medicines/ai-suggest status:", aiResponse.status);
  console.log("  AI data:", {
    brandName: aiData.data.brandName,
    genericName: aiData.data.genericName,
    originalMrp: aiData.data.originalMrp,
    price: aiData.data.price,
    source: aiData.source,
  });
  if (!aiData.success || !aiData.data.genericName) {
    throw new Error("Expected AI suggest to return genericName for Dolomide");
  }
  console.log("  ✓ AI medicine suggestion endpoint working properly");

  // 3. Marketplace GET with buyerLocality & sort=nearby
  const marketResponse = await fetch(`${API_BASE}/medicines?buyerLocality=Hinjewadi&sort=nearby&limit=5`);
  const marketData = await marketResponse.json();
  console.log("- API GET /api/medicines?buyerLocality=Hinjewadi&sort=nearby status:", marketResponse.status);
  console.log(`  Fetched ${marketData.data.length} listings with buyerLocality='${marketData.buyerLocality}'`);
  
  marketData.data.forEach((med, idx) => {
    console.log(`    [${idx + 1}] ${med.brandName || med.medicineName} | Locality: ${med.locality} | Dist: ${med.proximity?.distanceKm} km (${med.proximity?.label})`);
  });

  // Verify that the first item is closest to Hinjewadi
  if (marketData.data.length >= 2) {
    const d0 = marketData.data[0].proximity?.distanceKm ?? 0;
    const d1 = marketData.data[1].proximity?.distanceKm ?? 0;
    if (d0 > d1) {
      throw new Error(`Expected ascending distance order, but item 0 (${d0}km) > item 1 (${d1}km)`);
    }
  }
  console.log("  ✓ Marketplace sorted listings deterministically by Haversine distance from Hinjewadi");

  console.log("\n==================================================");
  console.log("ALL LOCALITY AND PRICING TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
