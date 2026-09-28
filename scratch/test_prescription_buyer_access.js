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

async function runBuyerAccessTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — PRESCRIPTION BUYER ACCESS & STREAMING TEST SUITE");
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
    // Setup: Register User A (Primary Buyer) and User B (Unauthorized Buyer)
    // -------------------------------------------------------------
    console.log("--- Setup: Registering Test Buyers (User A and User B) ---");
    const regUserA = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "User A (Dr. Patient)",
        email: `buyer_a_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822110001",
        address: "Shivaji Nagar, Pune",
      }),
    });
    const tokenA = regUserA.data?.data?.token;
    const userAId = regUserA.data?.data?.user?._id;
    if (userAId) testUserIds.push(userAId);
    assert(tokenA && userAId, "Registered User A with valid JWT");

    const regUserB = await request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "User B (Other Buyer)",
        email: `buyer_b_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822110002",
        address: "Kalyani Nagar, Pune",
      }),
    });
    const tokenB = regUserB.data?.data?.token;
    const userBId = regUserB.data?.data?.user?._id;
    if (userBId) testUserIds.push(userBId);
    assert(tokenB && userBId, "Registered User B with valid JWT");

    // -------------------------------------------------------------
    // Test 1: User A uploads prescription (Step 2 regression verification)
    // -------------------------------------------------------------
    console.log("\n--- Test 1: User A Uploads Prescription (POST /api/prescriptions) ---");
    const pdfContent = "%PDF-1.4 User A confidential prescription doc " + ts;
    const formA = new FormData();
    formA.append("patientName", "User A Patient");
    formA.append("doctorName", "Dr. Rajesh Sharma, MD");
    formA.append("doctorRegistrationNumber", "MCI-998822");
    formA.append("prescribedSalts", "Amoxicillin 500mg, Clavulanic Acid 125mg");
    formA.append(
      "prescription",
      new Blob([pdfContent], { type: "application/pdf" }),
      "user_a_prescription.pdf"
    );

    const uploadResA = await request("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formA,
    });

    assert(uploadResA.status === 201, "User A uploaded prescription with 201 Created");
    const prescriptionA = uploadResA.data?.data;
    const prescriptionAId = prescriptionA?._id;
    if (prescriptionA?.documentPath) createdDocPaths.push(prescriptionA.documentPath);
    assert(prescriptionAId, `Prescription ID received: ${prescriptionAId}`);

    // -------------------------------------------------------------
    // Test 2: User A retrieves own prescriptions (GET /api/prescriptions/my-prescriptions)
    // -------------------------------------------------------------
    console.log("\n--- Test 2: User A Retrieves Own Prescriptions (GET /api/prescriptions/my-prescriptions) ---");
    const myPrescriptionsRes = await request("/prescriptions/my-prescriptions", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(myPrescriptionsRes.status === 200, "GET /api/prescriptions/my-prescriptions returns 200 OK");
    const listA = myPrescriptionsRes.data?.data;
    assert(Array.isArray(listA) && listA.length >= 1, "User A received array of prescriptions");
    const foundA = listA.find((p) => p._id === prescriptionAId);
    assert(!!foundA, "User A's uploaded prescription is present in my-prescriptions list");
    assert(foundA?.patientName === "User A Patient", "Metadata patientName is correctly retrieved");
    assert(foundA?.doctorName === "Dr. Rajesh Sharma, MD", "Metadata doctorName is correctly retrieved");

    // -------------------------------------------------------------
    // Test 3: User A retrieves own prescription by ID (GET /api/prescriptions/:id)
    // -------------------------------------------------------------
    console.log("\n--- Test 3: User A Retrieves Own Prescription by ID (GET /api/prescriptions/:id) ---");
    const getByIdResA = await request(`/prescriptions/${prescriptionAId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(getByIdResA.status === 200, "User A successfully fetched own prescription by ID with 200 OK");
    assert(getByIdResA.data?.data?._id === prescriptionAId, "Returned prescription matches requested ID");
    assert(getByIdResA.data?.data?.patientName === "User A Patient", "Metadata matches patient name");

    // -------------------------------------------------------------
    // Test 4: User A accesses own prescription document (GET /api/prescriptions/:id/document)
    // -------------------------------------------------------------
    console.log("\n--- Test 4: User A Streams Own Prescription Document ---");
    const docStreamResA = await request(`/prescriptions/${prescriptionAId}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(docStreamResA.status === 200, "User A can stream own prescription document (200 OK)");
    const contentTypeA = docStreamResA.headers.get("content-type");
    const contentDispA = docStreamResA.headers.get("content-disposition");
    assert(contentTypeA?.includes("application/pdf"), `Correct Content-Type header: "${contentTypeA}"`);
    assert(contentDispA?.includes("inline") && contentDispA?.includes("user_a_prescription.pdf"), `Correct Content-Disposition header: "${contentDispA}"`);
    assert(docStreamResA.text?.includes("User A confidential prescription doc"), "Streamed document content matches uploaded file");

    // -------------------------------------------------------------
    // Test 5: User B CANNOT retrieve User A's prescription metadata (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n--- Test 5: User B Blocked from User A's Metadata (403 Forbidden) ---");
    const crossUserMetaRes = await request(`/prescriptions/${prescriptionAId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(crossUserMetaRes.status === 403, `User B rejected with 403 Forbidden: "${crossUserMetaRes.data?.message}"`);

    // -------------------------------------------------------------
    // Test 6: User B CANNOT download/stream User A's document (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n--- Test 6: User B Blocked from User A's Document Stream (403 Forbidden) ---");
    const crossUserDocRes = await request(`/prescriptions/${prescriptionAId}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(crossUserDocRes.status === 403, "User B rejected with 403 Forbidden when requesting User A's document");

    // Also verify User B's my-prescriptions does NOT contain User A's prescription
    const myPrescriptionsB = await request("/prescriptions/my-prescriptions", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const foundAinB = myPrescriptionsB.data?.data?.find((p) => p._id === prescriptionAId);
    assert(!foundAinB, "User A's prescription does NOT appear in User B's my-prescriptions");

    // -------------------------------------------------------------
    // Test 7: Unauthenticated requests are rejected (401 Unauthorized)
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Unauthenticated Requests Rejected (401 Unauthorized) ---");
    const unauthList = await request("/prescriptions/my-prescriptions", { method: "GET" });
    assert(unauthList.status === 401, "Unauthenticated GET /my-prescriptions rejected with 401");

    const unauthGetId = await request(`/prescriptions/${prescriptionAId}`, { method: "GET" });
    assert(unauthGetId.status === 401, "Unauthenticated GET /:id rejected with 401");

    const unauthGetDoc = await request(`/prescriptions/${prescriptionAId}/document`, { method: "GET" });
    assert(unauthGetDoc.status === 401, "Unauthenticated GET /:id/document rejected with 401");

    // -------------------------------------------------------------
    // Test 8: Invalid MongoDB ObjectId handled cleanly (404/400)
    // -------------------------------------------------------------
    console.log("\n--- Test 8: Invalid MongoDB ObjectId Handling ---");
    const invalidIdRes = await request("/prescriptions/not-a-valid-mongo-id", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(invalidIdRes.status === 404 || invalidIdRes.status === 400, `Invalid ID returned clean status ${invalidIdRes.status}`);

    const invalidDocRes = await request("/prescriptions/not-a-valid-mongo-id/document", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(invalidDocRes.status === 404 || invalidDocRes.status === 400, `Invalid doc ID returned clean status ${invalidDocRes.status}`);

    // -------------------------------------------------------------
    // Test 9: Non-existent prescription returns 404
    // -------------------------------------------------------------
    console.log("\n--- Test 9: Non-existent Prescription Returns 404 ---");
    const nonExistentId = "507f1f77bcf86cd799439011";
    const nonExistentMeta = await request(`/prescriptions/${nonExistentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(nonExistentMeta.status === 404, "Non-existent prescription metadata returns 404 Not Found");

    const nonExistentDoc = await request(`/prescriptions/${nonExistentId}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(nonExistentDoc.status === 404, "Non-existent prescription document stream returns 404 Not Found");

    // -------------------------------------------------------------
    // Test 10: Missing physical file returns 404
    // -------------------------------------------------------------
    console.log("\n--- Test 10: Missing Physical File on Server Returns Clean 404 ---");
    // Create a prescription in DB referencing a non-existent file
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: Prescription } = await import("../backend/models/Prescription.js");
    const { default: User } = await import("../backend/models/User.js");

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }

    const missingFilePrescription = await Prescription.create({
      buyer: userAId,
      patientName: "User A Ghost File",
      documentPath: path.resolve(__dirname, "../backend/uploads/prescriptions/ghost_file_does_not_exist.pdf"),
      documentOriginalName: "ghost_file.pdf",
      documentMimeType: "application/pdf",
      fileSize: 1024,
      status: "pending",
    });

    const missingFileDocRes = await request(`/prescriptions/${missingFilePrescription._id}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      missingFileDocRes.status === 404,
      `Missing physical file returns 404 without crashing server (${missingFileDocRes.status})`
    );

    // -------------------------------------------------------------
    // Test 11: Responses do NOT expose physical documentPath
    // -------------------------------------------------------------
    console.log("\n--- Test 11: Privacy - Responses Do Not Expose documentPath ---");
    assert(
      foundA.documentPath === undefined,
      "documentPath is excluded from GET /my-prescriptions response"
    );
    assert(
      getByIdResA.data?.data?.documentPath === undefined,
      "documentPath is excluded from GET /:id response"
    );

    // -------------------------------------------------------------
    // Test 12: Directory traversal attack defense
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Security - Directory Traversal Prevention ---");
    const traversalPrescription = await Prescription.create({
      buyer: userAId,
      patientName: "User A Hacker Test",
      documentPath: path.resolve(__dirname, "../backend/models/User.js"), // Attempting to escape uploads dir
      documentOriginalName: "User.js",
      documentMimeType: "application/javascript",
      fileSize: 2048,
      status: "pending",
    });

    const traversalRes = await request(`/prescriptions/${traversalPrescription._id}/document`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      traversalRes.status === 403,
      `Path traversal attempt outside uploads dir rejected with 403 Forbidden (${traversalRes.status})`
    );

    // -------------------------------------------------------------
    // Cleanup: Clean up MongoDB records and disk files
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
    console.log(`[INFO] Cleaned up ${cleanedFilesCount} disk files and removed test users/prescriptions.`);
    await mongoose.disconnect();

  } catch (error) {
    console.error("Buyer Access Test Suite encountered an error:", error);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(`BUYER ACCESS TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBuyerAccessTests();
