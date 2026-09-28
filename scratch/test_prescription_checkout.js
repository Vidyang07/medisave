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

// Direct DB connection for test setup & cleanup
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave";

async function runPrescriptionCheckoutTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — PRESCRIPTION → CHECKOUT INTEGRATION TEST SUITE");
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

    // 1. Setup Test Users
    console.log("--- 1. Setting Up Test Users ---");

    // Admin user for approving prescriptions & moderating medicines
    const adminEmail = `admin_rx_${ts}@medisave.org`;
    const adminRegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin Coordinator",
        email: adminEmail,
        password: "AdminPassword123!",
        phone: "+91 98765 43201",
        address: "Admin Health Office, Pune",
      }),
    });
    assert(adminRegRes.status === 201, "Admin user registered");
    const adminToken = adminRegRes.data.data.token;
    const adminId = adminRegRes.data.data.user?._id || adminRegRes.data.data._id;
    // Elevate to admin role directly in DB
    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(adminId) },
      { $set: { role: "admin", isVerified: true } }
    );

    // Seller user who lists medicines
    const sellerEmail = `seller_rx_${ts}@medisave.org`;
    const sellerRegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Seller Pharmacy",
        email: sellerEmail,
        password: "SellerPassword123!",
        phone: "+91 98765 43202",
        address: "Shivaji Nagar, Pune",
      }),
    });
    assert(sellerRegRes.status === 201, "Seller user registered");
    const sellerToken = sellerRegRes.data.data.token;
    const sellerId = sellerRegRes.data.data.user?._id || sellerRegRes.data.data._id;

    // Buyer 1 (Legitimate Buyer)
    const buyer1Email = `buyer1_rx_${ts}@medisave.org`;
    const buyer1RegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ramesh Sharma",
        email: buyer1Email,
        password: "Buyer1Password123!",
        phone: "+91 98765 43203",
        address: "Kothrud, Pune",
      }),
    });
    assert(buyer1RegRes.status === 201, "Buyer 1 registered");
    const buyer1Token = buyer1RegRes.data.data.token;
    const buyer1Id = buyer1RegRes.data.data.user?._id || buyer1RegRes.data.data._id;

    // Buyer 2 (Second Buyer / Attacker)
    const buyer2Email = `buyer2_rx_${ts}@medisave.org`;
    const buyer2RegRes = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Suresh Patil",
        email: buyer2Email,
        password: "Buyer2Password123!",
        phone: "+91 98765 43204",
        address: "Viman Nagar, Pune",
      }),
    });
    assert(buyer2RegRes.status === 201, "Buyer 2 registered");
    const buyer2Token = buyer2RegRes.data.data.token;
    const buyer2Id = buyer2RegRes.data.data.user?._id || buyer2RegRes.data.data._id;

    // 2. Create Test Medicines (OTC Non-Rx, Rx Medicine 1, Rx Medicine 2)
    console.log("\n--- 2. Setting Up Test Medicines ---");

    // OTC Medicine (Non-Rx)
    const nonRxMedRes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        medicineName: `Paracetamol 500mg OTC ${ts}`,
        genericName: "Paracetamol",
        brandName: "Crocin Advance",
        company: "GSK Consumer",
        category: "Pain Relief",
        dosageForm: "Tablet",
        strength: "500mg",
        price: 30,
        originalMrp: 45,
        quantity: 50,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: false,
      }),
    });
    assert(nonRxMedRes.status === 201, "OTC Medicine created");
    const nonRxMedId = nonRxMedRes.data.data._id;
    // Moderate to approved
    await request(`/admin/medicines/${nonRxMedId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    // Rx Medicine A
    const rxMedARes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        medicineName: `Amoxicillin 500mg Rx A ${ts}`,
        genericName: "Amoxicillin",
        brandName: "Mox 500",
        company: "Ranbaxy / Sun Pharma",
        category: "Antibiotics",
        dosageForm: "Capsule",
        strength: "500mg",
        price: 85,
        originalMrp: 140,
        quantity: 20,
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: true,
      }),
    });
    assert(rxMedARes.status === 201, "Rx Medicine A created");
    const rxMedAId = rxMedARes.data.data._id;
    await request(`/admin/medicines/${rxMedAId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    // Rx Medicine B
    const rxMedBRes = await request("/medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        medicineName: `Azithromycin 500mg Rx B ${ts}`,
        genericName: "Azithromycin",
        brandName: "Azee 500",
        company: "Cipla Ltd",
        category: "Antibiotics",
        dosageForm: "Tablet",
        strength: "500mg",
        price: 110,
        originalMrp: 180,
        quantity: 15,
        expiryDate: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(),
        isPrescriptionRequired: true,
      }),
    });
    assert(rxMedBRes.status === 201, "Rx Medicine B created");
    const rxMedBId = rxMedBRes.data.data._id;
    await request(`/admin/medicines/${rxMedBId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    // 3. Helper to create prescription via API / Multer upload
    console.log("\n--- 3. Setting Up Prescriptions for Testing ---");

    const uploadPrescriptionHelper = async (token, patientName, doctorName) => {
      const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
      const fileContent = `%PDF-1.4 Mock Rx Document for ${patientName} - ${Date.now()}`;
      
      let body = "";
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="patientName"\r\n\r\n${patientName}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="doctorName"\r\n\r\n${doctorName}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="doctorRegistrationNumber"\r\n\r\nMCI-${Date.now().toString().slice(-6)}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="prescribedSalts"\r\n\r\nAmoxicillin, Azithromycin\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="prescription"; filename="rx_${patientName.replace(/\s+/g, "_")}.pdf"\r\n`;
      body += `Content-Type: application/pdf\r\n\r\n${fileContent}\r\n`;
      body += `--${boundary}--\r\n`;

      const res = await request("/prescriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (res.data?.data?.documentPath) {
        createdDocPaths.push(res.data.data.documentPath);
      }
      return res;
    };

    // Buyer 1: Valid Approved Prescription (Permanent / No Expiry)
    const p1Res = await uploadPrescriptionHelper(buyer1Token, "Ramesh Sharma", "Dr. V. K. Mehta");
    assert(p1Res.status === 201, "Buyer 1 uploaded Prescription 1 (pending)");
    const validApprovedRxId = p1Res.data.data._id;
    // Admin approves it
    const app1Res = await request(`/admin/prescriptions/${validApprovedRxId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    assert(app1Res.status === 200, "Prescription 1 approved by admin");

    // Buyer 1: Pending Prescription (never approved)
    const p2Res = await uploadPrescriptionHelper(buyer1Token, "Ramesh Sharma", "Dr. S. K. Joshi");
    assert(p2Res.status === 201, "Buyer 1 uploaded Prescription 2 (remains pending)");
    const pendingRxId = p2Res.data.data._id;

    // Buyer 1: Rejected Prescription
    const p3Res = await uploadPrescriptionHelper(buyer1Token, "Ramesh Sharma", "Dr. A. Verma");
    assert(p3Res.status === 201, "Buyer 1 uploaded Prescription 3");
    const rejectedRxId = p3Res.data.data._id;
    const rejRes = await request(`/admin/prescriptions/${rejectedRxId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ rejectionReason: "Document illegible / doctor signature missing" }),
    });
    assert(rejRes.status === 200, "Prescription 3 rejected by admin");

    // Buyer 1: Expired Prescription (Approved with past validUntil)
    const p4Res = await uploadPrescriptionHelper(buyer1Token, "Ramesh Sharma", "Dr. P. Nair");
    assert(p4Res.status === 201, "Buyer 1 uploaded Prescription 4");
    const expiredRxId = p4Res.data.data._id;
    // Update validUntil in past directly in DB with approved status
    await db.collection("prescriptions").updateOne(
      { _id: new mongoose.Types.ObjectId(expiredRxId) },
      {
        $set: {
          status: "approved",
          validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          reviewedBy: new mongoose.Types.ObjectId(adminId),
          reviewedAt: new Date(),
        },
      }
    );

    // Buyer 2: Approved Prescription belonging to Buyer 2
    const p5Res = await uploadPrescriptionHelper(buyer2Token, "Suresh Patil", "Dr. R. Deshmukh");
    assert(p5Res.status === 201, "Buyer 2 uploaded Prescription 5");
    const buyer2ApprovedRxId = p5Res.data.data._id;
    await request(`/admin/prescriptions/${buyer2ApprovedRxId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });

    // -------------------------------------------------------------
    // TEST 1: Non-prescription medicine can be purchased without prescription
    console.log("\n--- TEST 1: Purchase non-prescription medicine without prescription ---");
    const stockBeforeT1 = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(nonRxMedId) })).quantity;
    const t1Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: nonRxMedId, quantity: 2 }],
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t1Res.status === 201, "Test 1: Status is 201 Created");
    assert(t1Res.data?.success === true, "Test 1: success is true");
    assert(t1Res.data?.data?.prescription === null || t1Res.data?.data?.prescription === undefined, "Test 1: Order prescription reference is null");
    const stockAfterT1 = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(nonRxMedId) })).quantity;
    assert(stockAfterT1 === stockBeforeT1 - 2, "Test 1: Stock decremented correctly by 2");

    // -------------------------------------------------------------
    // TEST 2: Prescription medicine without prescription is rejected
    console.log("\n--- TEST 2: Prescription medicine without prescription is rejected ---");
    const stockRxABeforeT2 = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(rxMedAId) })).quantity;
    const t2Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t2Res.status === 400, `Test 2: Rejected with 400 (Received: ${t2Res.status})`);
    assert(t2Res.data?.message === "An approved prescription is required for this order.", `Test 2: Error message matches "${t2Res.data?.message}"`);
    const stockRxAAfterT2 = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(rxMedAId) })).quantity;
    assert(stockRxAAfterT2 === stockRxABeforeT2, "Test 2: Stock was NOT modified on failure");

    // -------------------------------------------------------------
    // TEST 3: Valid approved prescription allows purchase
    console.log("\n--- TEST 3: Valid approved prescription allows purchase ---");
    const t3Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: validApprovedRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t3Res.status === 201, "Test 3: Status is 201 Created");
    assert(t3Res.data?.success === true, "Test 3: Order placed successfully");
    const t3Prescription = t3Res.data?.data?.prescription;
    const t3PrescriptionId = t3Prescription?._id || t3Prescription;
    assert(t3PrescriptionId?.toString() === validApprovedRxId.toString(), "Test 3: Order correctly stores prescription reference");

    // -------------------------------------------------------------
    // TEST 4: Pending prescription is rejected
    console.log("\n--- TEST 4: Pending prescription is rejected ---");
    const t4Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: pendingRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t4Res.status === 400, `Test 4: Status is 400 (Received: ${t4Res.status})`);
    assert(t4Res.data?.message === "Prescription has not been approved.", `Test 4: Message is "${t4Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 5: Rejected prescription is rejected
    console.log("\n--- TEST 5: Rejected prescription is rejected ---");
    const t5Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: rejectedRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t5Res.status === 400, `Test 5: Status is 400 (Received: ${t5Res.status})`);
    assert(t5Res.data?.message === "Prescription has not been approved.", `Test 5: Message is "${t5Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 6: Expired prescription is rejected
    console.log("\n--- TEST 6: Expired prescription is rejected ---");
    const t6Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: expiredRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t6Res.status === 400, `Test 6: Status is 400 (Received: ${t6Res.status})`);
    assert(t6Res.data?.message === "Prescription has expired.", `Test 6: Message is "${t6Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 7: Non-existent prescription ID is rejected
    console.log("\n--- TEST 7: Non-existent prescription ID is rejected ---");
    const fakeId = new mongoose.Types.ObjectId().toString();
    const t7Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: fakeId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t7Res.status === 400 || t7Res.status === 404, `Test 7: Status is 400/404 (Received: ${t7Res.status})`);
    assert(t7Res.data?.message === "Prescription not found.", `Test 7: Message is "${t7Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 8: Another user's prescription is rejected
    console.log("\n--- TEST 8: Another user's prescription is rejected ---");
    // Buyer 1 tries to use Buyer 2's approved prescription
    const t8Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: buyer2ApprovedRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t8Res.status === 403, `Test 8: Status is 403 Forbidden (Received: ${t8Res.status})`);
    assert(t8Res.data?.message === "You are not authorized to use this prescription.", `Test 8: Message is "${t8Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 9: Fake prescription approval/status submitted by client is ignored
    console.log("\n--- TEST 9: Fake client status injection is ignored ---");
    // Buyer sends pending prescription ID but embeds status: "approved" in payload
    const t9Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedAId, quantity: 1 }],
        prescriptionId: pendingRxId,
        prescription: {
          _id: pendingRxId,
          status: "approved",
          isApproved: true,
        },
        status: "approved",
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t9Res.status === 400, "Test 9: Server rejects because DB record is pending");
    assert(t9Res.data?.message === "Prescription has not been approved.", `Test 9: Message is "${t9Res.data?.message}"`);

    // -------------------------------------------------------------
    // TEST 10: Client-modified medicine price is ignored
    console.log("\n--- TEST 10: Client-modified medicine price is ignored ---");
    const t10Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: nonRxMedId, quantity: 1, price: 1, subtotal: 1 }],
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t10Res.status === 201, "Test 10: Order created");
    assert(t10Res.data?.data?.items[0]?.price === 30, `Test 10: Item price enforced by server as 30 (Received: ${t10Res.data?.data?.items[0]?.price})`);
    assert(t10Res.data?.data?.subtotal === 30, `Test 10: Subtotal computed by server as 30 (Received: ${t10Res.data?.data?.subtotal})`);

    // -------------------------------------------------------------
    // TEST 11: Client-modified seller is ignored
    console.log("\n--- TEST 11: Client-modified seller is ignored ---");
    const fakeSellerId = new mongoose.Types.ObjectId().toString();
    const t11Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: nonRxMedId, quantity: 1, seller: fakeSellerId }],
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t11Res.status === 201, "Test 11: Order created");
    assert(t11Res.data?.data?.items[0]?.seller?.toString() === sellerId.toString(), "Test 11: Item seller taken from DB record, not client");

    // -------------------------------------------------------------
    // TEST 12: Client-modified total is ignored
    console.log("\n--- TEST 12: Client-modified total is ignored ---");
    const t12Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: nonRxMedId, quantity: 1 }],
        subtotal: 5,
        shippingFee: 0,
        totalAmount: 5,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t12Res.status === 201, "Test 12: Order created");
    // 30 subtotal + 25 shipping (<200) = 55 totalAmount
    assert(t12Res.data?.data?.totalAmount === 55, `Test 12: Total correctly calculated as 55 by server (Received: ${t12Res.data?.data?.totalAmount})`);

    // -------------------------------------------------------------
    // TEST 13: Mixed Rx + non-Rx cart works with valid prescription
    console.log("\n--- TEST 13: Mixed Rx + non-Rx cart works with valid prescription ---");
    const t13Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [
          { medicineId: nonRxMedId, quantity: 2 }, // 2 * 30 = 60
          { medicineId: rxMedAId, quantity: 1 },    // 1 * 85 = 85
        ],
        prescriptionId: validApprovedRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t13Res.status === 201, "Test 13: Mixed order placed with 201");
    assert(t13Res.data?.data?.items?.length === 2, "Test 13: Order contains both items");
    assert(t13Res.data?.data?.subtotal === 145, `Test 13: Subtotal is 145 (60+85) (Received: ${t13Res.data?.data?.subtotal})`);
    assert(t13Res.data?.data?.prescription !== null, "Test 13: Prescription reference is stored");

    // -------------------------------------------------------------
    // TEST 14: Multiple Rx medicines work with single valid prescription
    console.log("\n--- TEST 14: Multiple Rx medicines work with single valid prescription ---");
    const t14Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [
          { medicineId: rxMedAId, quantity: 1 }, // 85
          { medicineId: rxMedBId, quantity: 2 }, // 2 * 110 = 220
        ],
        prescriptionId: validApprovedRxId,
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t14Res.status === 201, "Test 14: Multi-Rx order placed with 201");
    assert(t14Res.data?.data?.items?.length === 2, "Test 14: Order contains both Rx items");
    assert(t14Res.data?.data?.subtotal === 305, `Test 14: Subtotal is 305 (85+220) (Received: ${t14Res.data?.data?.subtotal})`);
    assert(t14Res.data?.data?.shippingFee === 0, "Test 14: Free shipping applied for subtotal >= 200");
    assert(t14Res.data?.data?.totalAmount === 305, "Test 14: Total payable is 305");

    // -------------------------------------------------------------
    // TEST 15: Stock is not modified when prescription validation fails
    console.log("\n--- TEST 15: Stock is not modified on prescription validation failure ---");
    const rxBStockBefore = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(rxMedBId) })).quantity;
    const t15Res = await request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        items: [{ medicineId: rxMedBId, quantity: 5 }],
        prescriptionId: expiredRxId, // Invalid expired
        shippingAddress: {
          fullName: "Ramesh Sharma",
          phone: "+91 98765 43203",
          address: "101, Mayur Colony",
          city: "Pune",
          state: "Maharashtra",
        },
      }),
    });
    assert(t15Res.status === 400, "Test 15: Order creation rejected");
    const rxBStockAfter = (await db.collection("medicines").findOne({ _id: new mongoose.Types.ObjectId(rxMedBId) })).quantity;
    assert(rxBStockAfter === rxBStockBefore, `Test 15: Stock maintained exactly at ${rxBStockBefore}`);

    // -------------------------------------------------------------
    // TEST 16: Existing successful order flow (getMyOrders, getSellerOrders, getOrderById) still works
    console.log("\n--- TEST 16: Existing order query flows still work ---");
    const myOrdersRes = await request("/orders/my-orders", {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    });
    assert(myOrdersRes.status === 200, "Test 16: GET /api/orders/my-orders returns 200");
    assert(Array.isArray(myOrdersRes.data?.data) && myOrdersRes.data.data.length > 0, "Test 16: Buyer orders retrieved");

    const sellerOrdersRes = await request("/orders/seller-orders", {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerOrdersRes.status === 200, "Test 16: GET /api/orders/seller-orders returns 200");
    assert(Array.isArray(sellerOrdersRes.data?.data) && sellerOrdersRes.data.data.length > 0, "Test 16: Seller orders retrieved");

    const orderIdToTest = myOrdersRes.data.data[0]._id;
    const singleOrderRes = await request(`/orders/${orderIdToTest}`, {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    });
    assert(singleOrderRes.status === 200, "Test 16: GET /api/orders/:id returns 200");
    assert(singleOrderRes.data?.data?._id === orderIdToTest, "Test 16: Order ID matches");

    // -------------------------------------------------------------
    // TEST 17: Prescription reference is correctly populated in buyer and seller queries
    console.log("\n--- TEST 17: Prescription reference populated in order responses ---");
    const rxOrderWithPrescription = myOrdersRes.data.data.find((o) => o.prescription);
    assert(Boolean(rxOrderWithPrescription), "Test 17: Found order with populated prescription");
    if (rxOrderWithPrescription) {
      assert(rxOrderWithPrescription.prescription.patientName === "Ramesh Sharma", "Test 17: Populated patientName matches");
      assert(rxOrderWithPrescription.prescription.status === "approved", "Test 17: Populated status is approved");
    }

    console.log("\n===============================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================");

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    // Cleanup generated files
    for (const filePath of createdDocPaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        // ignore
      }
    }
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runPrescriptionCheckoutTests();
