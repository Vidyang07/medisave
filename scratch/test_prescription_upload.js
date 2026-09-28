import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return {
    status: res.status,
    ok: res.ok,
    data,
  };
}

async function runPrescriptionUploadTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — PRESCRIPTION UPLOAD LAYER AUTOMATED TEST SUITE");
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
    // -------------------------------------------------------------
    // Setup: Register Test User
    // -------------------------------------------------------------
    console.log("--- Setup: Registering Test Buyer ---");
    const regBuyer = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smt. Shaila Patil",
        email: `buyer_rx_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822000123",
        address: "Kothrud, Pune",
      }),
    });

    const buyerToken = regBuyer.data?.data?.token;
    const buyerId = regBuyer.data?.data?.user?._id;
    assert(buyerToken && buyerId, "Registered buyer test user with JWT");

    // -------------------------------------------------------------
    // Test 1: Unauthenticated upload -> 401
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Unauthenticated Upload Rejection ---");
    const form1 = new FormData();
    form1.append("patientName", "Shaila Patil");
    form1.append(
      "prescription",
      new Blob(["%PDF-1.4 mock pdf content"], { type: "application/pdf" }),
      "doctor_prescription.pdf"
    );

    const unauthRes = await request("/prescriptions", {
      method: "POST",
      body: form1,
    });
    assert(unauthRes.status === 401, "Unauthenticated POST /api/prescriptions rejected with 401");

    // -------------------------------------------------------------
    // Test 2: Missing file -> 400
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Missing File Rejection ---");
    const form2 = new FormData();
    form2.append("patientName", "Shaila Patil");

    const noFileRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form2,
    });
    assert(
      noFileRes.status === 400 && noFileRes.data?.message?.includes("upload a prescription"),
      `Missing file rejected with 400: "${noFileRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 3: Missing patientName -> 400
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Missing Patient Name Rejection ---");
    const form3 = new FormData();
    form3.append(
      "prescription",
      new Blob(["%PDF-1.4 mock pdf content"], { type: "application/pdf" }),
      "doctor_prescription.pdf"
    );

    const noNameRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form3,
    });
    assert(
      noNameRes.status === 400 && noNameRes.data?.message?.includes("Patient name is required"),
      `Missing patientName rejected with 400: "${noNameRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 4: PDF upload -> Success (201)
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Valid PDF Upload ---");
    const form4 = new FormData();
    form4.append("patientName", "Smt. Shaila Patil");
    form4.append("doctorName", "Dr. Arvind Kulkarni, MD");
    form4.append("doctorRegistrationNumber", "MCI-48912");
    form4.append("prescribedSalts", "Azithromycin 500mg, Paracetamol 650mg");
    form4.append(
      "prescription",
      new Blob(["%PDF-1.4 sample valid prescription PDF document content"], {
        type: "application/pdf",
      }),
      "my_doctor_rx.pdf"
    );

    const pdfUploadRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form4,
    });

    const pdfDoc = pdfUploadRes.data?.data;
    assert(pdfUploadRes.status === 201, "PDF prescription uploaded with 201 Created");
    assert(pdfDoc?.documentMimeType === "application/pdf", "MIME type stored as application/pdf");
    assert(pdfDoc?.documentOriginalName === "my_doctor_rx.pdf", "Original filename recorded");
    if (pdfDoc?.documentPath) createdDocPaths.push(pdfDoc.documentPath);

    // -------------------------------------------------------------
    // Test 5: JPEG upload -> Success (201)
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Valid JPEG Upload ---");
    const form5 = new FormData();
    form5.append("patientName", "Smt. Shaila Patil");
    form5.append(
      "prescription",
      new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])], {
        type: "image/jpeg",
      }),
      "clinic_slip.jpg"
    );

    const jpegUploadRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form5,
    });

    const jpegDoc = jpegUploadRes.data?.data;
    assert(jpegUploadRes.status === 201, "JPEG prescription uploaded with 201 Created");
    assert(jpegDoc?.documentMimeType === "image/jpeg", "MIME type stored as image/jpeg");
    if (jpegDoc?.documentPath) createdDocPaths.push(jpegDoc.documentPath);

    // -------------------------------------------------------------
    // Test 6: PNG upload -> Success (201)
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Valid PNG Upload ---");
    const form6 = new FormData();
    form6.append("patientName", "Smt. Shaila Patil");
    form6.append(
      "prescription",
      new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], {
        type: "image/png",
      }),
      "rx_scan.png"
    );

    const pngUploadRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form6,
    });

    const pngDoc = pngUploadRes.data?.data;
    assert(pngUploadRes.status === 201, "PNG prescription uploaded with 201 Created");
    assert(pngDoc?.documentMimeType === "image/png", "MIME type stored as image/png");
    if (pngDoc?.documentPath) createdDocPaths.push(pngDoc.documentPath);

    // -------------------------------------------------------------
    // Test 7: Unsupported file type -> Rejected (400)
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Unsupported File Type Rejection ---");
    const form7 = new FormData();
    form7.append("patientName", "Smt. Shaila Patil");
    form7.append(
      "prescription",
      new Blob(["plaintext executable code"], { type: "text/plain" }),
      "malicious_script.txt"
    );

    const badExtRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form7,
    });
    assert(
      badExtRes.status === 400 && badExtRes.data?.message?.includes("Unsupported file type"),
      `Text/unsupported file rejected with 400: "${badExtRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 8: File over 5 MB -> Rejected (400)
    // -------------------------------------------------------------
    console.log("\n--- Test 8: File Size Limit (5 MB) Enforcement ---");
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0x41); // 6 MB
    const form8 = new FormData();
    form8.append("patientName", "Smt. Shaila Patil");
    form8.append(
      "prescription",
      new Blob([largeBuffer], { type: "application/pdf" }),
      "oversized_prescription.pdf"
    );

    const largeFileRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form8,
    });
    assert(
      largeFileRes.status === 400 && largeFileRes.data?.message?.includes("5 MB limit"),
      `File exceeding 5MB rejected with 400: "${largeFileRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 9: Uploaded prescription starts with status 'pending'
    // -------------------------------------------------------------
    console.log("\n--- Test 9: Default Status is 'pending' ---");
    assert(pdfDoc?.status === "pending", "Prescription status initializes strictly to 'pending'");

    // -------------------------------------------------------------
    // Test 10: buyer is taken from authenticated JWT, not request body
    // -------------------------------------------------------------
    console.log("\n--- Test 10: Security - buyer Field Overwrite Prevention ---");
    const fakeBuyerId = "507f1f77bcf86cd799439011";
    const form10 = new FormData();
    form10.append("patientName", "Smt. Shaila Patil");
    form10.append("buyer", fakeBuyerId); // Client tampering attempt
    form10.append(
      "prescription",
      new Blob(["%PDF-1.4 sample PDF"], { type: "application/pdf" }),
      "tamper_test.pdf"
    );

    const tamperBuyerRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form10,
    });

    const tamperBuyerDoc = tamperBuyerRes.data?.data;
    assert(
      tamperBuyerDoc?.buyer === buyerId && tamperBuyerDoc?.buyer !== fakeBuyerId,
      `Buyer ID strictly bound to JWT (${tamperBuyerDoc?.buyer}) and ignored spoofed body ID (${fakeBuyerId})`
    );
    if (tamperBuyerDoc?.documentPath) createdDocPaths.push(tamperBuyerDoc.documentPath);

    // -------------------------------------------------------------
    // Test 11, 12, 13: Client cannot set status='approved', reviewedBy, validUntil
    // -------------------------------------------------------------
    console.log("\n--- Tests 11-13: Security - Admin Field Tamper Immunity ---");
    const form11 = new FormData();
    form11.append("patientName", "Smt. Shaila Patil");
    form11.append("status", "approved"); // Tamper attempt
    form11.append("reviewedBy", fakeBuyerId); // Tamper attempt
    form11.append("validUntil", "2030-01-01"); // Tamper attempt
    form11.append(
      "prescription",
      new Blob(["%PDF-1.4 sample PDF"], { type: "application/pdf" }),
      "tamper_admin_fields.pdf"
    );

    const tamperAdminRes = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: form11,
    });

    const tamperAdminDoc = tamperAdminRes.data?.data;
    assert(tamperAdminDoc?.status === "pending", "Test 11: Client cannot mark prescription as approved (remains 'pending')");
    assert(!tamperAdminDoc?.reviewedBy, "Test 12: Client cannot set reviewedBy (remains null)");
    assert(!tamperAdminDoc?.validUntil, "Test 13: Client cannot set validUntil (remains null)");
    if (tamperAdminDoc?.documentPath) createdDocPaths.push(tamperAdminDoc.documentPath);

    // -------------------------------------------------------------
    // Test 14: Original filename is not used as storage filename
    // -------------------------------------------------------------
    console.log("\n--- Test 14: Safe Server-Generated Filename Verification ---");
    const storageFilename = path.basename(pdfDoc?.documentPath || "");
    assert(
      storageFilename.startsWith("prescription_") && storageFilename !== "my_doctor_rx.pdf",
      `Storage filename is server-generated safe ID (${storageFilename}), not user filename`
    );

    // -------------------------------------------------------------
    // Cleanup: Clean up MongoDB test prescriptions and uploaded disk files
    // -------------------------------------------------------------
    console.log("\n--- Cleanup: Removing Test Uploaded Files and DB Records ---");
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: Prescription } = await import("../backend/models/Prescription.js");
    const { default: User } = await import("../backend/models/User.js");

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }

    await Prescription.deleteMany({ buyer: buyerId });
    await User.findByIdAndDelete(buyerId);

    let cleanedFilesCount = 0;
    for (const filePath of createdDocPaths) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          cleanedFilesCount++;
        } catch {}
      }
    }
    console.log(`[INFO] Successfully cleaned up ${cleanedFilesCount} test prescription files from disk and deleted test user.`);
    await mongoose.disconnect();

  } catch (error) {
    console.error("Prescription Upload Test Suite encountered an error:", error);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(`PRESCRIPTION UPLOAD TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPrescriptionUploadTests();
