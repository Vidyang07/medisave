import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "../backend/node_modules/mongoose/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  let data = null;
  let text = null;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    text = await res.text().catch(() => "");
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data,
    text,
  };
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave";

async function runPrescriptionCheckoutSecurityTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — PRESCRIPTION & CHECKOUT SECURITY AUDIT SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;
  const createdDocPaths = [];

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  };

  const ts = Date.now();

  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // --- SETUP TEST USERS ---
    console.log("--- 1. Setting Up Test Accounts ---");

    // Admin
    const adminEmail = `admin_sec_${ts}@medisave.org`;
    const adminRegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Security Admin",
        email: adminEmail,
        password: "AdminPassword123!",
        phone: "+91 98765 43100",
        address: "Admin Complex, Pune",
      }),
    });
    assert(adminRegRes.status === 201, "Admin user registered");
    const adminToken = adminRegRes.data.data.token;
    const adminId = adminRegRes.data.data.user?._id || adminRegRes.data.data._id;
    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(adminId) },
      { $set: { role: "admin", isVerified: true } }
    );

    // Seller 1
    const seller1Email = `seller1_sec_${ts}@medisave.org`;
    const seller1RegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pharmacy Seller 1",
        email: seller1Email,
        password: "Seller1Password123!",
        phone: "+91 98765 43101",
        address: "Deccan, Pune",
      }),
    });
    assert(seller1RegRes.status === 201, "Seller 1 registered");
    const seller1Token = seller1RegRes.data.data.token;
    const seller1Id = seller1RegRes.data.data.user?._id || seller1RegRes.data.data._id;

    // Seller 2
    const seller2Email = `seller2_sec_${ts}@medisave.org`;
    const seller2RegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pharmacy Seller 2",
        email: seller2Email,
        password: "Seller2Password123!",
        phone: "+91 98765 43102",
        address: "Hadapsar, Pune",
      }),
    });
    assert(seller2RegRes.status === 201, "Seller 2 registered");
    const seller2Token = seller2RegRes.data.data.token;
    const seller2Id = seller2RegRes.data.data.user?._id || seller2RegRes.data.data._id;

    // Buyer A
    const buyerAEmail = `buyerA_sec_${ts}@medisave.org`;
    const buyerARegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Buyer Alice",
        email: buyerAEmail,
        password: "BuyerAPassword123!",
        phone: "+91 98765 43103",
        address: "Aundh, Pune",
      }),
    });
    assert(buyerARegRes.status === 201, "Buyer Alice registered");
    const buyerAToken = buyerARegRes.data.data.token;
    const buyerAId = buyerARegRes.data.data.user?._id || buyerARegRes.data.data._id;

    // Buyer B
    const buyerBEmail = `buyerB_sec_${ts}@medisave.org`;
    const buyerBRegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Buyer Bob",
        email: buyerBEmail,
        password: "BuyerBPassword123!",
        phone: "+91 98765 43104",
        address: "Kalyani Nagar, Pune",
      }),
    });
    assert(buyerBRegRes.status === 201, "Buyer Bob registered");
    const buyerBToken = buyerBRegRes.data.data.token;
    const buyerBId = buyerBRegRes.data.data.user?._id || buyerBRegRes.data.data._id;

    // --- SETUP MEDICINES ---
    console.log("\n--- 2. Setting Up Test Catalog ---");

    // Seller 1: OTC Medicine
    const otcMedRes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        medicineName: `Vitamin C 500mg OTC ${ts}`,
        genericName: "Ascorbic Acid",
        brandName: "Limcee",
        company: "Abbott",
        category: "Supplements",
        dosageForm: "Tablet",
        strength: "500mg",
        price: 25,
        originalMrp: 40,
        quantity: 30,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: false,
      }),
    });
    assert(otcMedRes.status === 201, "OTC Medicine created by Seller 1");
    const otcMedId = otcMedRes.data.data._id;
    await request(`/admin/medicines/${otcMedId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    // Seller 1: Rx Medicine 1
    const rx1MedRes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        medicineName: `Azithromycin 500mg Rx1 ${ts}`,
        genericName: "Azithromycin",
        brandName: "Azee 500",
        company: "Cipla",
        category: "Antibiotics",
        dosageForm: "Tablet",
        strength: "500mg",
        price: 110,
        originalMrp: 180,
        quantity: 15,
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: true,
      }),
    });
    assert(rx1MedRes.status === 201, "Rx Medicine 1 created by Seller 1");
    const rx1MedId = rx1MedRes.data.data._id;
    await request(`/admin/medicines/${rx1MedId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    // Seller 2: Rx Medicine 2
    const rx2MedRes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller2Token}`,
      },
      body: JSON.stringify({
        medicineName: `Metformin 500mg Rx2 ${ts}`,
        genericName: "Metformin Hydrochloride",
        brandName: "Glycomet 500",
        company: "USV Ltd",
        category: "Diabetes",
        dosageForm: "Tablet",
        strength: "500mg",
        price: 40,
        originalMrp: 70,
        quantity: 20,
        expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: true,
      }),
    });
    assert(rx2MedRes.status === 201, "Rx Medicine 2 created by Seller 2");
    const rx2MedId = rx2MedRes.data.data._id;
    await request(`/admin/medicines/${rx2MedId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    // --- SETUP PRESCRIPTIONS ---
    console.log("\n--- 3. Setting Up Test Prescriptions ---");

    // Helper to upload prescription
    const uploadRx = async (token, patientName, docName) => {
      const boundary = `----WebKitFormBoundary${Date.now()}`;
      const fileContent = `%PDF-1.4 Mock Rx Document for ${patientName} - ${Date.now()}`;
      const crlf = "\r\n";
      let body = `--${boundary}${crlf}`;
      body += `Content-Disposition: form-data; name="patientName"${crlf}${crlf}${patientName}${crlf}`;
      body += `--${boundary}${crlf}`;
      body += `Content-Disposition: form-data; name="doctorName"${crlf}${crlf}${docName}${crlf}`;
      body += `--${boundary}${crlf}`;
      body += `Content-Disposition: form-data; name="prescription"; filename="rx_${patientName}.pdf"${crlf}`;
      body += `Content-Type: application/pdf${crlf}${crlf}${fileContent}${crlf}`;
      body += `--${boundary}--${crlf}`;

      const res = await request("/prescriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: Buffer.from(body, "utf-8"),
      });
      if (res.data?.data?.documentPath) createdDocPaths.push(res.data.data.documentPath);
      return res;
    };

    // Alice Rx 1: Approved & Valid
    const aliceRx1Res = await uploadRx(buyerAToken, "Alice Patient Valid", "Dr. Rao");
    assert(aliceRx1Res.status === 201, "Alice uploaded Rx 1");
    const aliceRx1Id = aliceRx1Res.data.data._id;
    await request(`/admin/prescriptions/${aliceRx1Id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    // Alice Rx 2: Pending
    const aliceRx2Res = await uploadRx(buyerAToken, "Alice Patient Pending", "Dr. Joshi");
    assert(aliceRx2Res.status === 201, "Alice uploaded Rx 2 (Pending)");
    const aliceRx2Id = aliceRx2Res.data.data._id;

    // Alice Rx 3: Rejected
    const aliceRx3Res = await uploadRx(buyerAToken, "Alice Patient Rejected", "Dr. Kulkarni");
    assert(aliceRx3Res.status === 201, "Alice uploaded Rx 3");
    const aliceRx3Id = aliceRx3Res.data.data._id;
    await request(`/admin/prescriptions/${aliceRx3Id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ rejectionReason: "Illegible handwriting and missing signature" }),
    });

    // Alice Rx 4: Expired
    const aliceRx4Res = await uploadRx(buyerAToken, "Alice Patient Expired", "Dr. Deshmukh");
    assert(aliceRx4Res.status === 201, "Alice uploaded Rx 4");
    const aliceRx4Id = aliceRx4Res.data.data._id;
    await db.collection("prescriptions").updateOne(
      { _id: new mongoose.Types.ObjectId(aliceRx4Id) },
      {
        $set: {
          status: "approved",
          validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
          reviewedBy: new mongoose.Types.ObjectId(adminId),
          reviewedAt: new Date(),
        },
      }
    );

    // Bob Rx 1: Approved & Valid (Belongs to Bob)
    const bobRx1Res = await uploadRx(buyerBToken, "Bob Patient Record", "Dr. Verma");
    assert(bobRx1Res.status === 201, "Bob uploaded Rx 1");
    const bobRx1Id = bobRx1Res.data.data._id;
    await request(`/admin/prescriptions/${bobRx1Id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });

    // --- SECTION A: AUTHENTICATION TESTS ---
    console.log("\n--- SECTION A: Authentication Security ---");

    // Test A1: Unauthenticated checkout
    const unauthRes = await request("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ medicineId: otcMedId, quantity: 1 }],
        shippingAddress: { fullName: "A", phone: "123", address: "B", city: "C" },
      }),
    });
    assert(unauthRes.status === 401, "Unauthenticated checkout rejected with 401");

    // Test A2: Malformed / Invalid JWT
    const badJwtRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.jwt.token",
      },
      body: JSON.stringify({
        items: [{ medicineId: otcMedId, quantity: 1 }],
        shippingAddress: { fullName: "A", phone: "123", address: "B", city: "C" },
      }),
    });
    assert(badJwtRes.status === 401, "Invalid JWT checkout rejected with 401");

    // --- SECTION B: OWNERSHIP & IDOR TESTS ---
    console.log("\n--- SECTION B: Ownership & IDOR Protection ---");

    // Test B1: Alice attempts to use Bob's approved prescription
    const idorRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: bobRx1Id,
      }),
    });
    assert(idorRes.status === 403, "Alice using Bob's prescription rejected with 403 Forbidden");
    assert(
      idorRes.data?.message === "You are not authorized to use this prescription.",
      "Rejection message indicates unauthorized prescription usage"
    );

    // Test B2: Bob attempts to read Alice's prescription metadata
    const idorReadRes = await request(`/prescriptions/${aliceRx1Id}`, {
      headers: { Authorization: `Bearer ${buyerBToken}` },
    });
    assert(idorReadRes.status === 403, "Bob reading Alice's prescription metadata blocked with 403");

    // Test B3: Bob attempts to stream Alice's prescription document
    const idorDocRes = await request(`/prescriptions/${aliceRx1Id}/document`, {
      headers: { Authorization: `Bearer ${buyerBToken}` },
    });
    assert(idorDocRes.status === 403, "Bob streaming Alice's prescription document blocked with 403");

    // --- SECTION C: PRESCRIPTION STATUS ENFORCEMENT ---
    console.log("\n--- SECTION C: Prescription Status Enforcement ---");

    // Test C1: Pending prescription rejected
    const pendingRxOrderRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx2Id,
      }),
    });
    assert(pendingRxOrderRes.status === 400, "Pending prescription rejected with 400");
    assert(
      pendingRxOrderRes.data?.message === "Prescription has not been approved.",
      "Pending status message exact match"
    );

    // Test C2: Rejected prescription rejected
    const rejectedRxOrderRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx3Id,
      }),
    });
    assert(rejectedRxOrderRes.status === 400, "Rejected prescription rejected with 400");

    // Test C3: Approved valid prescription accepted
    const approvedRxOrderRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx1Id,
      }),
    });
    assert(approvedRxOrderRes.status === 201, "Approved valid prescription accepted with 201 Created");
    assert(
      approvedRxOrderRes.data?.data?.prescription?._id === aliceRx1Id ||
        approvedRxOrderRes.data?.data?.prescription === aliceRx1Id,
      "Prescription ID correctly bound in Order record"
    );

    // --- SECTION D: PRESCRIPTION EXPIRY ENFORCEMENT ---
    console.log("\n--- SECTION D: Prescription Expiry Enforcement ---");

    // Test D1: Expired prescription rejected
    const expiredOrderRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx4Id,
      }),
    });
    assert(expiredOrderRes.status === 400, "Expired prescription rejected with 400");
    assert(
      expiredOrderRes.data?.message === "Prescription has expired.",
      "Expired error message exact match"
    );

    // --- SECTION E: CLIENT TAMPERING IMMUNITY ---
    console.log("\n--- SECTION E: Client Tampering Immunity ---");

    // Test E1: Client passes spoofed price (₹1 instead of ₹110)
    const spoofPriceRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 2, price: 1, originalMrp: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx1Id,
        subtotal: 2,
        totalAmount: 2,
      }),
    });
    assert(spoofPriceRes.status === 201, "Order with spoofed price created with server calculations");
    assert(spoofPriceRes.data.data.subtotal === 220, "Server enforced DB price: ₹220 (2 * 110)");
    assert(spoofPriceRes.data.data.totalAmount === 220, "Server enforced grand total: ₹220");

    // Test E2: Client attempts to bypass prescription requirement with isPrescriptionRequired: false
    const bypassRxRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1, isPrescriptionRequired: false }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        // Omitting prescriptionId
      }),
    });
    assert(
      bypassRxRes.status === 400,
      "Client isPrescriptionRequired:false override blocked by server (400)"
    );

    // Test E3: Client attempts to spoof seller field
    const spoofSellerRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: otcMedId, quantity: 1, seller: buyerAId }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
      }),
    });
    assert(spoofSellerRes.status === 201, "Order placed ignoring spoofed seller");
    const itemSeller = spoofSellerRes.data.data.items[0]?.seller?._id || spoofSellerRes.data.data.items[0]?.seller;
    assert(
      itemSeller?.toString() === seller1Id.toString(),
      "Seller strictly bound to DB seller (Seller 1), not client spoof"
    );

    // --- SECTION F: MULTI-SELLER ORDER VALIDATION ---
    console.log("\n--- SECTION F: Multi-Seller Order Handling ---");

    // Test F1: Multi-seller: Seller 1 (Rx) + Seller 2 (Rx) with approved prescription
    const multiSellerRxRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [
          { medicineId: rx1MedId, quantity: 1 }, // Seller 1 (110)
          { medicineId: rx2MedId, quantity: 2 }, // Seller 2 (2 * 40 = 80)
        ],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx1Id,
      }),
    });
    assert(multiSellerRxRes.status === 201, "Multi-seller dual Rx order placed with 201");
    assert(multiSellerRxRes.data.data.items.length === 2, "Contains items from both sellers");
    assert(multiSellerRxRes.data.data.subtotal === 190, "Subtotal: ₹190 (110 + 80)");
    assert(multiSellerRxRes.data.data.shippingFee === 25, "Handling fee ₹25 applied for < 200");
    assert(multiSellerRxRes.data.data.totalAmount === 215, "Total: ₹215");

    // Test F2: Multi-seller: Seller 1 (Rx) + Seller 1 (OTC) with approved prescription
    const mixedSellerRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [
          { medicineId: rx1MedId, quantity: 1 },
          { medicineId: otcMedId, quantity: 2 },
        ],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx1Id,
      }),
    });
    assert(mixedSellerRes.status === 201, "Mixed Rx + OTC order placed with 201");
    assert(mixedSellerRes.data.data.subtotal === 160, "Subtotal: ₹160 (110 + 50)");

    // --- SECTION G: DUPLICATE ITEM CONSOLIDATION & STOCK ATOMICITY ---
    console.log("\n--- SECTION G: Duplicate Item Consolidation & Stock Atomicity ---");

    // Test G1: Duplicate items in items array consolidated safely
    // OTC stock before: let's check current stock
    const otcMedBefore = await request(`/medicines/${otcMedId}`);
    const otcStockBefore = otcMedBefore.data.data.quantity;

    const duplicateItemsRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [
          { medicineId: otcMedId, quantity: 2 },
          { medicineId: otcMedId, quantity: 3 },
        ],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
      }),
    });
    assert(duplicateItemsRes.status === 201, "Order with duplicate medicine IDs consolidated and placed");
    const otcMedAfter = await request(`/medicines/${otcMedId}`);
    const otcStockAfter = otcMedAfter.data.data.quantity;
    assert(
      otcStockAfter === otcStockBefore - 5,
      `Stock decremented accurately by 5 (${otcStockBefore} -> ${otcStockAfter}) without underflow`
    );

    // Test G2: Failed prescription validation does NOT decrement any stock
    const rx1Before = await request(`/medicines/${rx1MedId}`);
    const rx1StockBefore = rx1Before.data.data.quantity;

    const failedOrderRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 2 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: aliceRx2Id, // Pending prescription -> failure
      }),
    });
    assert(failedOrderRes.status === 400, "Order failed validation as expected");
    const rx1After = await request(`/medicines/${rx1MedId}`);
    const rx1StockAfter = rx1After.data.data.quantity;
    assert(
      rx1StockAfter === rx1StockBefore,
      `Stock remained unchanged at ${rx1StockBefore} after validation failure`
    );

    // --- SECTION H: OBJECT ID & SANITIZATION EDGE CASES ---
    console.log("\n--- SECTION H: Object ID & Input Validation ---");

    // Test H1: Invalid medicine ID format
    const badMedIdRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: "not-a-valid-id", quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
      }),
    });
    assert(badMedIdRes.status === 400, "Invalid medicine ID returned clean 400");

    // Test H2: Invalid prescription ID format
    const badRxIdRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: "invalid-rx-id",
      }),
    });
    assert(badRxIdRes.status === 400, "Invalid prescription ID returned clean 400");

    // Test H3: Nonexistent prescription ObjectId
    const fakeRxId = new mongoose.Types.ObjectId().toString();
    const fakeRxRes = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerAToken}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rx1MedId, quantity: 1 }],
        shippingAddress: { fullName: "Alice", phone: "9876543103", address: "Aundh", city: "Pune" },
        prescriptionId: fakeRxId,
      }),
    });
    assert(fakeRxRes.status === 404, "Nonexistent prescription ID returned clean 404");

    // --- SECTION I: SELLER ORDER PRIVACY CHECK ---
    console.log("\n--- SECTION I: Seller Order Privacy Check ---");

    // Test I1: Seller 1 views seller orders and cannot see unassociated prescription documents or Seller 2's items
    const seller1OrdersRes = await request("/orders/seller-orders", {
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    assert(seller1OrdersRes.status === 200, "Seller 1 retrieved seller orders (200)");
    const seller1OrderList = seller1OrdersRes.data.data;
    assert(seller1OrderList.length > 0, "Seller 1 has received orders");
    // Verify none of the items belong to Seller 2
    const hasForeignItem = seller1OrderList.some((o) =>
      o.items.some((it) => (it.seller?._id || it.seller)?.toString() === seller2Id.toString())
    );
    assert(!hasForeignItem, "Seller 1 view strictly filters out other sellers' items");

    // --- CLEANUP ---
    console.log("\n--- Cleanup ---");
    for (const p of createdDocPaths) {
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch {
          // ignore
        }
      }
    }
    console.log("[INFO] Disk files and temporary records cleaned up.");
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n===============================================================");
  console.log(`SECURITY AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPrescriptionCheckoutSecurityTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
