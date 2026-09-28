import { getAiMedicineEstimation } from "../backend/services/aiMedicineService.js";

async function runComprehensiveAiVerification() {
  console.log("==================================================");
  console.log("COMPREHENSIVE AI MEDICINE & PRICING VERIFICATION");
  console.log("==================================================\n");

  const testCases = [
    { name: "Dolo 650", expectedCategory: "Pain & Fever", expectedRx: false },
    { name: "Dolomide", expectedCategory: "Pain & Fever", expectedRx: false },
    { name: "Augmentin 625 Duo", expectedCategory: "Antibiotics", expectedRx: true },
    { name: "Pantocid 40", expectedCategory: "Digestive Health", expectedRx: true },
    { name: "Pan-D", expectedCategory: "Digestive Health", expectedRx: true },
    { name: "Shelcal 500", expectedCategory: "Vitamins & Supplements", expectedRx: false },
    { name: "Azee 500", expectedCategory: "Antibiotics", expectedRx: true },
    { name: "Telma 40", expectedCategory: "Cardiovascular & BP", expectedRx: true },
    { name: "Montair LC", expectedCategory: "Respiratory", expectedRx: true },
    { name: "Unknown Antibiotic Ciprobid 500mg", expectedCategory: "Antibiotics", expectedRx: true },
    { name: "Unknown Cough Syrup Benadryl 100ml", expectedCategory: "Respiratory", expectedRx: false },
  ];

  let passed = 0;

  for (const tc of testCases) {
    try {
      const res = await getAiMedicineEstimation({ title: tc.name });
      const data = res.data;

      const hasAllFields =
        data.brandName &&
        data.genericName &&
        data.company &&
        data.category &&
        data.dosageForm &&
        data.strength &&
        typeof data.quantity === "number" &&
        data.quantity > 0 &&
        data.unit &&
        typeof data.originalMrp === "number" &&
        data.originalMrp > 0 &&
        typeof data.price === "number" &&
        data.price > 0 &&
        data.price <= data.originalMrp &&
        typeof data.isPrescriptionRequired === "boolean" &&
        data.storageCondition &&
        data.pricingExplanation;

      if (hasAllFields) {
        console.log(`✅ [PASS] "${tc.name}":`);
        console.log(`   - Generic Salt: ${data.genericName}`);
        console.log(`   - Category: ${data.category} | Form: ${data.dosageForm}`);
        console.log(`   - Qty: ${data.quantity} (${data.unit})`);
        console.log(`   - MRP: ₹${data.originalMrp} -> Resale: ₹${data.price} (${data.discountPercentage}% off)`);
        console.log(`   - Rx Required: ${data.isPrescriptionRequired}`);
        console.log(`   - Source: ${res.source} (${res.model})\n`);
        passed++;
      } else {
        console.error(`❌ [FAIL] "${tc.name}" is missing fields:`, data);
      }
    } catch (err) {
      console.error(`❌ [EXCEPTION] "${tc.name}":`, err.message);
    }
  }

  // Also test custom quantity scaling
  console.log("--- Testing Custom Quantity Scaling ---");
  const scaled = await getAiMedicineEstimation({ title: "Dolo 650", quantity: 30 });
  if (scaled.data.quantity === 30 && scaled.data.price > 18) {
    console.log(`✅ Scaled 30 units: MRP ₹${scaled.data.originalMrp}, Price ₹${scaled.data.price}`);
    passed++;
  } else {
    console.error("❌ Quantity scaling test failed:", scaled);
  }

  console.log(`\nVerification Result: ${passed}/${testCases.length + 1} test suites PASSED perfectly!`);
}

runComprehensiveAiVerification().catch(console.error);
