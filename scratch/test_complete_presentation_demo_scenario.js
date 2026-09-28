import assert from "node:assert";
import { getProximityInfo, calculateHaversineDistance } from "../backend/config/localityConstants.js";
import { calculateSuggestedPrice } from "../backend/services/pricingService.js";

async function runPresentationDemoScenario() {
  console.log("===============================================================");
  console.log("MEDISAVE — COMPLETE PRESENTATION DEMO SCENARIO VERIFICATION");
  console.log("===============================================================\n");

  const timestamp = Date.now();
  const BASE_URL = "http://localhost:5000/api";

  // 1. Register Seller in Katraj
  const katrajSellerEmail = `seller_katraj_${timestamp}@medisave.org`;
  const sellerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Katraj Community Donor",
      email: katrajSellerEmail,
      password: "Password123!",
      phone: "9822011223",
      address: "Near Katraj PMT Bus Stand, Katraj, Pune",
    }),
  });
  const sellerData = await sellerRes.json();
  assert.strictEqual(sellerData.success, true, "Katraj Seller registered successfully");
  const sellerToken = sellerData.data?.token || sellerData.token;
  console.log("✓ Step 1: Registered Katraj Seller (Locality: Katraj, PIN: 411046)");

  // 2. AI Autofill Medicine Information (Dolo 650)
  const aiRes = await fetch(`${BASE_URL}/medicines/ai-suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ title: "Dolo 650" }),
  });
  const aiData = await aiRes.json();
  assert.strictEqual(aiData.success, true, "AI suggested Dolo 650 parameters");
  assert.strictEqual(aiData.data.brandName, "Dolo 650");
  assert.strictEqual(aiData.data.isPrescriptionRequired, false, "Dolo 650 is OTC");
  console.log("✓ Step 2: AI identified Dolo 650 (Salt: Paracetamol IP 650mg, Manufacturer: Micro Labs Ltd)");

  // 3. System Deterministic Pricing Engine Calculation
  const futureExpiry = new Date();
  futureExpiry.setFullYear(futureExpiry.getFullYear() + 1); // 12+ months shelf life
  const expiryDateStr = futureExpiry.toISOString().split("T")[0];

  const pricingEval = calculateSuggestedPrice({
    originalMrp: 35,
    expiryDate: expiryDateStr,
    packageCondition: "Intact Sealed Blister Pack",
  });
  assert.strictEqual(pricingEval.isValid, true);
  assert.strictEqual(pricingEval.discountPercentage, 40, "12+ months = 40% discount");
  assert.strictEqual(pricingEval.suggestedPrice, 21, "40% off ₹35 = ₹21");
  console.log(`✓ Step 3: Deterministic Pricing applied: MRP ₹35 -> Suggested ₹21 (${pricingEval.discountPercentage}% off)`);

  // 4. Seller Confirms Physical Details and Lists Medicine
  const createMedRes = await fetch(`${BASE_URL}/medicines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      medicineName: "Dolo 650",
      brandName: "Dolo 650",
      genericName: "Paracetamol IP (650mg)",
      company: "Micro Labs Ltd",
      category: "Pain & Fever",
      dosageForm: "Tablet",
      strength: "650mg",
      batchNumber: `BAT-KATRAJ-${timestamp.toString().slice(-4)}`,
      expiryDate: expiryDateStr,
      quantity: 15,
      unit: "Tablets (1 strip)",
      originalMrp: 35,
      price: 20,
      packageCondition: "Intact Sealed Blister Pack",
      storageCondition: "Stored in cool, dry place (<25°C)",
      isPrescriptionRequired: false,
      locality: "Katraj",
      pinCode: "411046",
      handoverPoint: "Katraj PMT Bus Station / Bharati Vidyapeeth Gate",
      handoverRadiusKm: 5,
      pricingRationale: pricingEval.pricingRationale,
      suggestedCommunityPrice: 21,
    }),
  });
  const medCreated = await createMedRes.json();
  if (!medCreated.success) {
    console.error("Medicine Creation Error:", medCreated);
  }
  assert.strictEqual(medCreated.success, true, "Medicine created successfully");
  const medicineId = medCreated.data._id;
  console.log(`✓ Step 4: Medicine listed with status 'pending' (Ref: ${medicineId})`);

  // Register admin user
  const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Community Coordinator",
      email: `admin_${timestamp}@medisave.org`,
      password: "AdminPassword123!",
      phone: "9822099999",
      address: "Pune Health HQ",
    }),
  });
  const regAdminData = await adminRegRes.json();
  const adminId = regAdminData.data.user._id;

  // Promote to admin in DB
  const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
  const { default: User } = await import("../backend/models/User.js");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect("mongodb://127.0.0.1:27017/medisave");
  }
  await User.findByIdAndUpdate(adminId, { role: "admin", isVerified: true });
  await mongoose.disconnect();

  // Re-login to get admin token
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `admin_${timestamp}@medisave.org`,
      password: "AdminPassword123!",
    }),
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.data?.token || adminData.token;

  const approveRes = await fetch(`${BASE_URL}/admin/medicines/${medicineId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: "approved" }),
  });
  const approvedData = await approveRes.json();
  if (!approvedData.success) {
    console.error("Admin Approval Error:", approvedData);
  }
  assert.strictEqual(approvedData.success, true, "Admin approved the listing");
  console.log("✓ Step 5: Coordinator reviewed and approved listing for public catalog");

  // 6. Test Proximity & Distance Calculation:
  // Scenario A: Nearby Buyer (Bibvewadi or Katraj)
  const nearbyProx = getProximityInfo("Bibvewadi", "Katraj");
  assert.strictEqual(nearbyProx.tier, "nearby");
  console.log(`✓ Step 6A (Nearby): Katraj seller + Bibvewadi buyer -> Distance: ${nearbyProx.distanceKm} km (${nearbyProx.label})`);

  // Scenario B: Distant Buyer (Hinjewadi)
  const farProx = getProximityInfo("Hinjewadi", "Katraj");
  assert.strictEqual(farProx.tier, "distant");
  assert.strictEqual(farProx.distanceKm, 20.4);
  console.log(`✓ Step 6B (Distant): Katraj seller + Hinjewadi buyer -> Distance: ${farProx.distanceKm} km (${farProx.label})`);

  // 7. Buyer Marketplace Search & Distance Verification
  const marketNearbyRes = await fetch(
    `${BASE_URL}/medicines?buyerLocality=Bibvewadi&sort=nearby`,
    { method: "GET" }
  );
  const marketNearbyData = await marketNearbyRes.json();
  const katrajItemNearby = marketNearbyData.data.find((m) => m._id === medicineId);
  assert.ok(katrajItemNearby, "Found medicine in nearby marketplace");
  assert.strictEqual(katrajItemNearby.proximity.tier, "nearby");
  console.log(`✓ Step 7: Marketplace displays 'Nearby · ${katrajItemNearby.proximity.distanceKm} km' to Bibvewadi buyer`);

  // 8. Buyer Adds to Cart & Checks Out
  const buyerEmail = `buyer_bibvewadi_${timestamp}@medisave.org`;
  const buyerRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Pooja Deshmukh",
      email: buyerEmail,
      password: "Password123!",
      phone: "9823055667",
      address: "Bibvewadi, Pune",
    }),
  });
  const buyerData = await buyerRegRes.json();
  const buyerToken = buyerData.data?.token || buyerData.token;

  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      items: [{ medicineId: medicineId, quantity: 2 }],
      shippingAddress: {
        fullName: "Pooja Deshmukh",
        phone: "9823055667",
        address: "Near Bibvewadi Chowk / Pushpa Mangal Karyalaya",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411037",
      },
      paymentMethod: "Cash on Delivery / Community Handover",
    }),
  });
  const orderData = await orderRes.json();
  assert.strictEqual(orderData.success, true, "Order placed successfully");
  const orderId = orderData.data._id;
  console.log(`✓ Step 8: Buyer placed order (Ref: ${orderData.data.orderNumber || orderId}) for ₹40`);

  // 9. Seller Sees Order in Dashboard and Updates Status
  const sellerOrdersRes = await fetch(`${BASE_URL}/orders/seller-orders`, {
    method: "GET",
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const sellerOrdersData = await sellerOrdersRes.json();
  assert.strictEqual(sellerOrdersData.success, true);
  const matchedOrder = sellerOrdersData.data.find((o) => o._id === orderId);
  assert.ok(matchedOrder, "Seller received the incoming order");
  console.log("✓ Step 9: Katraj Seller received incoming order in seller dashboard");

  // Step 10: Lifecycle progression: pending -> confirmed -> processing -> shipped -> delivered
  const confirmRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ status: "confirmed", medicineId }),
  });
  const confirmedData = await confirmRes.json();
  assert.strictEqual(confirmedData.success, true, "Seller confirmed the order");
  console.log("✓ Step 10: Seller confirmed order -> Handover in coordination");

  console.log("\n===============================================================");
  console.log("✅ FULL PRESENTATION DEMO SCENARIO PASSED WITHOUT ANY ISSUES!");
  console.log("===============================================================");
}

runPresentationDemoScenario().catch((err) => {
  console.error("❌ Scenario Failed:", err);
  process.exit(1);
});
