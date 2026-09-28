import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  let data = null;
  let text = null;
  let buffer = null;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    buffer = Buffer.from(await res.arrayBuffer());
    text = buffer.toString("utf-8");
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data,
    buffer,
    text,
  };
}

async function runAdminPrescriptionVerificationTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — ADMIN PRESCRIPTION VERIFICATION TEST SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;
  const createdDocPaths = [];
  const testUserIds = [];

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
    // -------------------------------------------------------------
    // Setup: Register Admin and Normal Buyer
    // -------------------------------------------------------------
    console.log("--- Setup: Registering Test Admin and Normal Buyer ---");
    const regAdmin = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin Moderator Dr. Rao",
        email: `admin_rx_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822990011",
        address: "Deccan Gymkhana, Pune",
      }),
    });
    let adminToken = regAdmin.data?.data?.token;
    const adminId = regAdmin.data?.data?.user?._id;
    if (adminId) testUserIds.push(adminId);

    // Promote to Admin in MongoDB directly
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: User } = await import("../backend/models/User.js");
    const { default: Prescription } = await import("../backend/models/Prescription.js");

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }

    await User.findByIdAndUpdate(adminId, { role: "admin", isVerified: true });
    
    // Log in again to get token with admin role
    const loginAdmin = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `admin_rx_${ts}@test.medisave.org`,
        password: "Password123!",
      }),
    });
    adminToken = loginAdmin.data?.data?.token;
    assert(adminToken && adminId, "Created and promoted Admin user with verified JWT");

    // Register Normal Buyer
    const regBuyer = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Normal Buyer Patient",
        email: `buyer_normal_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822990022",
        address: "Kothrud, Pune",
      }),
    });
    const buyerToken = regBuyer.data?.data?.token;
    const buyerId = regBuyer.data?.data?.user?._id;
    if (buyerId) testUserIds.push(buyerId);
    assert(buyerToken && buyerId, "Created Normal Buyer user with valid JWT");

    // -------------------------------------------------------------
    // Setup Prescriptions: Upload 3 prescriptions for testing
    // -------------------------------------------------------------
    console.log("\n--- Setup: Uploading Test Prescriptions as Normal Buyer ---");
    
    // Rx 1: For Approval without validUntil
    const form1 = new FormData();
    form1.append("patientName", "Ramesh Shinde");
    form1.append("doctorName", "Dr. A. Kulkarni, MD");
    form1.append("doctorRegistrationNumber", "MCI-112233");
    form1.append("prescribedSalts", "Atorvastatin 20mg, Metformin 500mg");
    form1.append(
      "prescription",
      new Blob(["%PDF-1.4 sample rx 1 content"], { type: "application/pdf" }),
      "rx_approval_test.pdf"
    );
    const up1 = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form1,
    });
    const rx1 = up1.data?.data;
    if (rx1?.documentPath) createdDocPaths.push(rx1.documentPath);
    assert(up1.status === 201 && rx1?._id, "Uploaded Rx 1 for approval test");

    // Rx 2: For Approval WITH validUntil
    const form2 = new FormData();
    form2.append("patientName", "Sunita Deshmukh");
    form2.append("doctorName", "Dr. S. Joshi, MBBS");
    form2.append("doctorRegistrationNumber", "MMC-445566");
    form2.append(
      "prescription",
      new Blob(["%PDF-1.4 sample rx 2 content"], { type: "application/pdf" }),
      "rx_validity_test.pdf"
    );
    const up2 = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form2,
    });
    const rx2 = up2.data?.data;
    if (rx2?.documentPath) createdDocPaths.push(rx2.documentPath);
    assert(up2.status === 201 && rx2?._id, "Uploaded Rx 2 for future validity date test");

    // Rx 3: For Rejection
    const form3 = new FormData();
    form3.append("patientName", "Vikram More");
    form3.append("doctorName", "Dr. Unknown");
    form3.append(
      "prescription",
      new Blob(["%PDF-1.4 sample rx 3 content"], { type: "application/pdf" }),
      "rx_rejection_test.pdf"
    );
    const up3 = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form3,
    });
    const rx3 = up3.data?.data;
    if (rx3?.documentPath) createdDocPaths.push(rx3.documentPath);
    assert(up3.status === 201 && rx3?._id, "Uploaded Rx 3 for rejection test");

    // -------------------------------------------------------------
    // Test 1: Admin can retrieve pending prescriptions
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Admin Retrieves Pending Prescriptions (GET /api/admin/prescriptions) ---");
    const adminListRes = await request("/admin/prescriptions?status=pending", {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminListRes.status === 200, "Admin can retrieve prescription list (200 OK)");
    const adminPrescriptions = adminListRes.data?.data;
    assert(Array.isArray(adminPrescriptions) && adminPrescriptions.length >= 3, "Admin received array of pending prescriptions");
    const foundRx1 = adminPrescriptions.find((p) => p._id === rx1._id);
    assert(!!foundRx1, "Rx 1 is present in admin pending review queue");
    assert(foundRx1?.buyer?.name === "Normal Buyer Patient", "Buyer profile populated safely for admin");
    assert(foundRx1?.buyer?.password === undefined, "Buyer password is NOT exposed to admin");

    // -------------------------------------------------------------
    // Test 2: Admin can retrieve prescription by ID
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Admin Retrieves Prescription by ID (GET /api/admin/prescriptions/:id) ---");
    const adminDetailRes = await request(`/admin/prescriptions/${rx1._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDetailRes.status === 200, "Admin can retrieve prescription detail by ID (200 OK)");
    assert(adminDetailRes.data?.data?._id === rx1._id, "Retrieved prescription matches requested ID");
    assert(adminDetailRes.data?.data?.patientName === "Ramesh Shinde", "Metadata patientName matches");

    // -------------------------------------------------------------
    // Test 3: Admin can securely view prescription document
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Admin Securely Streams Prescription Document ---");
    const adminDocRes = await request(`/admin/prescriptions/${rx1._id}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDocRes.status === 200, "Admin can stream prescription document (200 OK)");
    assert(adminDocRes.headers.get("content-type")?.includes("application/pdf"), "Document Content-Type is application/pdf");
    assert(adminDocRes.headers.get("content-disposition")?.includes("rx_approval_test.pdf"), "Content-Disposition has filename");
    assert(adminDocRes.text?.includes("sample rx 1 content"), "Streamed document content matches uploaded file");

    // -------------------------------------------------------------
    // Tests 4-8: Non-Admin (Normal Buyer) Access Controls
    // -------------------------------------------------------------
    console.log("\n--- Tests 4-8: Non-Admin Access Restrictions (403 Forbidden) ---");
    
    // Test 4: Normal user list
    const nonAdminList = await request("/admin/prescriptions", {
      method: "GET",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(nonAdminList.status === 403, "Test 4: Normal user receives 403 on GET /api/admin/prescriptions");

    // Test 5: Normal user detail
    const nonAdminDetail = await request(`/admin/prescriptions/${rx1._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(nonAdminDetail.status === 403, "Test 5: Normal user receives 403 on GET /api/admin/prescriptions/:id");

    // Test 6: Normal user admin document stream
    const nonAdminDoc = await request(`/admin/prescriptions/${rx1._id}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(nonAdminDoc.status === 403, "Test 6: Normal user receives 403 on GET /api/admin/prescriptions/:id/document");

    // Test 7: Normal user approve
    const nonAdminApprove = await request(`/admin/prescriptions/${rx1._id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${buyerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert(nonAdminApprove.status === 403, "Test 7: Normal user cannot approve prescription (403 Forbidden)");

    // Test 8: Normal user reject
    const nonAdminReject = await request(`/admin/prescriptions/${rx1._id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${buyerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectionReason: "Invalid" }),
    });
    assert(nonAdminReject.status === 403, "Test 8: Normal user cannot reject prescription (403 Forbidden)");

    // -------------------------------------------------------------
    // Tests 9-11: Admin successfully approves pending prescription (Rx 1 without validUntil)
    // -------------------------------------------------------------
    console.log("\n--- Tests 9-11: Admin Approves Prescription without validUntil ---");
    const approveRes1 = await request(`/admin/prescriptions/${rx1._id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    assert(approveRes1.status === 200, "Test 9: Admin successfully approved pending prescription (200 OK)");
    const approvedDoc1 = approveRes1.data?.data;
    assert(approvedDoc1?.status === "approved", "Status transitioned to 'approved'");
    assert(
      approvedDoc1?.reviewedBy?._id === adminId || approvedDoc1?.reviewedBy === adminId,
      "Test 10: Approval set reviewedBy to Admin ID"
    );
    assert(!!approvedDoc1?.reviewedAt, "Test 11: Approval set reviewedAt timestamp");
    assert(approvedDoc1?.validUntil === null, "Test 13: Approval without validUntil leaves validUntil null");

    // -------------------------------------------------------------
    // Test 12: Approval WITH future validUntil (Rx 2)
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Admin Approves Prescription WITH Future validUntil ---");
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 days in future
    const approveRes2 = await request(`/admin/prescriptions/${rx2._id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ validUntil: futureDate }),
    });

    assert(approveRes2.status === 200, "Prescription approved with future validUntil (200 OK)");
    const approvedDoc2 = approveRes2.data?.data;
    assert(approvedDoc2?.status === "approved", "Status is 'approved'");
    assert(new Date(approvedDoc2?.validUntil).toISOString() === futureDate, "Test 12: Approval correctly stored future validUntil");

    // Past date rejection check
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // Temporary pending prescription to test past date rejection
    const formPast = new FormData();
    formPast.append("patientName", "Past Date Test");
    formPast.append(
      "prescription",
      new Blob(["%PDF-1.4 past date rx"], { type: "application/pdf" }),
      "past_date.pdf"
    );
    const upPast = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: formPast,
    });
    const rxPast = upPast.data?.data;
    if (rxPast?.documentPath) createdDocPaths.push(rxPast.documentPath);

    const pastApproveRes = await request(`/admin/prescriptions/${rxPast._id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ validUntil: pastDate }),
    });
    assert(
      pastApproveRes.status === 400 && pastApproveRes.data?.message?.includes("future date"),
      `Past validUntil date rejected with 400: "${pastApproveRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 14: Already approved prescription cannot be approved again
    // -------------------------------------------------------------
    console.log("\n--- Test 14: Already Approved Prescription Cannot Be Approved Again ---");
    const duplicateApprove = await request(`/admin/prescriptions/${rx1._id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert(
      duplicateApprove.status === 400 && duplicateApprove.data?.message?.includes("already approved"),
      `Duplicate approve blocked with 400: "${duplicateApprove.data?.message}"`
    );

    // -------------------------------------------------------------
    // Tests 15-20: Admin Rejection Flow
    // -------------------------------------------------------------
    console.log("\n--- Tests 15-20: Admin Rejection Flow ---");

    // Test 16: Rejection requires reason (missing)
    const rejectNoReason = await request(`/admin/prescriptions/${rx3._id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert(
      rejectNoReason.status === 400 && rejectNoReason.data?.message?.includes("reason is required"),
      `Test 16: Missing rejection reason rejected with 400: "${rejectNoReason.data?.message}"`
    );

    // Test 17: Empty/whitespace reason
    const rejectEmptyReason = await request(`/admin/prescriptions/${rx3._id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectionReason: "    " }),
    });
    assert(
      rejectEmptyReason.status === 400,
      `Test 17: Whitespace-only rejection reason rejected with 400: "${rejectEmptyReason.data?.message}"`
    );

    // Test 15, 18, 19, 20: Valid rejection
    const validReason = "Doctor signature is illegible and clinic registration stamp is missing.";
    const rejectRes = await request(`/admin/prescriptions/${rx3._id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectionReason: validReason }),
    });

    assert(rejectRes.status === 200, "Test 15: Admin successfully rejected pending prescription (200 OK)");
    const rejectedDoc = rejectRes.data?.data;
    assert(rejectedDoc?.status === "rejected", "Status transitioned to 'rejected'");
    assert(rejectedDoc?.rejectionReason === validReason, "Test 18: Stored correct rejection reason");
    assert(
      rejectedDoc?.reviewedBy?._id === adminId || rejectedDoc?.reviewedBy === adminId,
      "Test 19: Rejection set reviewedBy to Admin ID"
    );
    assert(!!rejectedDoc?.reviewedAt, "Test 20: Rejection set reviewedAt timestamp");

    // -------------------------------------------------------------
    // Test 21: Already rejected prescription cannot be rejected again
    // -------------------------------------------------------------
    console.log("\n--- Test 21: Already Rejected Prescription Cannot Be Rejected Again ---");
    const duplicateReject = await request(`/admin/prescriptions/${rx3._id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectionReason: "Another reason" }),
    });
    assert(
      duplicateReject.status === 400 && duplicateReject.data?.message?.includes("already rejected"),
      `Duplicate reject blocked with 400: "${duplicateReject.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 22: Invalid prescription ID handled safely
    // -------------------------------------------------------------
    console.log("\n--- Test 22: Invalid Prescription ID Handling ---");
    const invalidIdRes = await request("/admin/prescriptions/not-a-valid-id", {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(invalidIdRes.status === 404, `Invalid ID returned clean 404: "${invalidIdRes.data?.message}"`);

    // -------------------------------------------------------------
    // Test 23: Non-existent prescription returns 404
    // -------------------------------------------------------------
    console.log("\n--- Test 23: Non-existent Prescription Returns 404 ---");
    const nonExistentId = "507f1f77bcf86cd799439011";
    const nonExistentRes = await request(`/admin/prescriptions/${nonExistentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(nonExistentRes.status === 404, "Non-existent prescription detail returns 404");

    const nonExistentApprove = await request(`/admin/prescriptions/${nonExistentId}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert(nonExistentApprove.status === 404, "Non-existent prescription approve returns 404");

    // -------------------------------------------------------------
    // Test 24: documentPath is never returned in JSON
    // -------------------------------------------------------------
    console.log("\n--- Test 24: Privacy - documentPath Excluded from Admin JSON ---");
    assert(
      foundRx1.documentPath === undefined,
      "documentPath is excluded from GET /api/admin/prescriptions"
    );
    assert(
      adminDetailRes.data?.data?.documentPath === undefined,
      "documentPath is excluded from GET /api/admin/prescriptions/:id"
    );
    assert(
      approvedDoc1?.documentPath === undefined,
      "documentPath is excluded from approve response"
    );
    assert(
      rejectedDoc?.documentPath === undefined,
      "documentPath is excluded from reject response"
    );

    // -------------------------------------------------------------
    // Test 25: Prescription document inaccessible through public static URL
    // -------------------------------------------------------------
    console.log("\n--- Test 25: Security - Static Directory Not Exposed ---");
    const filename = path.basename(rx1?.documentPath || "prescription_sample.pdf");
    const publicStaticRes = await request(`/../uploads/prescriptions/${filename}`, {
      method: "GET",
    });
    assert(
      publicStaticRes.status === 404 || publicStaticRes.status === 403,
      `Direct public URL to uploads is not served via express.static (${publicStaticRes.status})`
    );

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log("\n--- Cleanup: Removing Test Uploaded Files and DB Records ---");
    await Prescription.deleteMany({ buyer: { $in: testUserIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });

    let cleanedFilesCount = 0;
    for (const filePath of createdDocPaths) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          cleanedFilesCount++;
        } catch {}
      }
    }
    console.log(`[INFO] Cleaned up ${cleanedFilesCount} disk files and deleted test users.`);
    await mongoose.disconnect();

  } catch (error) {
    console.error("Admin Verification Test Suite encountered an error:", error);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(`ADMIN PRESCRIPTION VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdminPrescriptionVerificationTests();
