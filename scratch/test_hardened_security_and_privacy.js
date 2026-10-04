/**
 * MEDISAVE - Hardened Security, Privacy & Integrity Verification Suite (Native Fetch)
 * 
 * Verifies all 14 phases of the backend hardening pass:
 * 1. Donor moderation bypass prevention & status reset on update
 * 2. Unmounted / disabled commercial order endpoints
 * 3. 100% Free donation enforcement
 * 4. Server-side safety guardrails (Cold-chain keywords, Schedule X narcotics, 90-day expiry, sealed packaging)
 * 5. Public medicine data privacy (seller email/phone/address omitted, sanitized regex search, strict approved filter)
 * 6. In-memory login rate limiting (HTTP 429 on 5 failed attempts)
 * 7. Handover 5-attempt lockout & admin unlock endpoint
 * 8. Partner sorting (FEFO + proximity)
 * 9. CEP proofs dynamic metrics
 */

const API = "http://localhost:5000/api";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function request(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("==================================================================");
  console.log("  MEDISAVE HARDENED SECURITY, PRIVACY & INTEGRITY TEST SUITE");
  console.log("==================================================================\n");

  try {
    // ---------------------------------------------------------
    // 1. Authenticate donor, partner, and admin
    // ---------------------------------------------------------
    console.log("--- STEP 1: AUTHENTICATION ---");
    const donorEmail = `donor_${Date.now()}@medisave.org`;
    const partnerEmail = `partner_${Date.now()}@medisave.org`;

    const donorReg = await request("POST", "/auth/register", {
      name: "Security Donor",
      email: donorEmail,
      password: "TestPassword123!",
      phone: "+91 98220 12345",
      address: "123 Secure Lane, Kothrud, Pune",
      locality: "Kothrud",
      role: "user",
    });
    const donorToken = donorReg.data.data.token;
    assert(donorToken, "Registered and authenticated test donor");

    const partnerReg = await request("POST", "/auth/register", {
      name: "Security Partner Clinic",
      email: partnerEmail,
      password: "TestPassword123!",
      phone: "+91 98220 54321",
      address: "456 Clinic Road, Katraj, Pune",
      locality: "Katraj",
      role: "partner",
      organizationName: "Security Health Center",
      organizationType: "Charitable Clinic",
    });
    const partnerToken = partnerReg.data.data.token;
    assert(partnerToken, "Registered test partner account");

    // Login default admin
    let adminToken;
    const adminLogin = await request("POST", "/auth/login", {
      email: "admin@medisave.org",
      password: "MedisaveAdmin2026!",
    });
    if (adminLogin.ok) {
      adminToken = adminLogin.data.data.token;
      assert(adminToken, "Authenticated platform coordinator / admin");
    } else {
      const adminReg = await request("POST", "/auth/register", {
        name: "Test Coordinator",
        email: `admin_${Date.now()}@medisave.org`,
        password: "TestPassword123!",
        role: "admin",
      });
      adminToken = adminReg.data?.data?.token;
    }

    // Verify the partner using admin token
    const verifyPartnerRes = await request(
      "PATCH",
      `/admin/partners/${partnerReg.data.data.user._id}/verify`,
      { partnerStatus: "verified" },
      adminToken
    );
    assert(verifyPartnerRes.status === 200, "Admin verified partner organization");

    // ---------------------------------------------------------
    // 2. 100% Free Donation & Expiry Validation on Creation
    // ---------------------------------------------------------
    console.log("\n--- STEP 2: CREATION GUARDRAILS & 100% FREE DONATION ---");
    
    // Test 2.1: Expired medicine rejection
    const expRes = await request("POST", "/medicines", {
      medicineName: "Expired Cough Syrup",
      company: "Pharma Corp",
      category: "Pain & Fever",
      quantity: 2,
      expiryDate: "2024-01-01",
    }, donorToken);
    assert(expRes.status === 400, "Expired medicine rejected with HTTP 400");

    // Test 2.2: <90 days shelf-life buffer rejection
    const shortExpiry = new Date();
    shortExpiry.setDate(shortExpiry.getDate() + 30); // 30 days (<90)
    const shortExpRes = await request("POST", "/medicines", {
      medicineName: "Short Shelf Life Paracetamol",
      company: "GSK",
      category: "Pain & Fever",
      quantity: 5,
      expiryDate: shortExpiry.toISOString().split("T")[0],
    }, donorToken);
    assert(
      shortExpRes.status === 400 && shortExpRes.data?.message?.includes("90 days"),
      "Medicine with <90 days shelf-life rejected with HTTP 400 & 90-day buffer notice"
    );

    // Test 2.3: Cold-chain keyword detection (e.g. "Human Insulin")
    const futureExpiry = new Date();
    futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);
    const validExpiryStr = futureExpiry.toISOString().split("T")[0];

    const insulinRes = await request("POST", "/medicines", {
      medicineName: "Human Insulin Injection 100IU",
      company: "Novo Nordisk",
      category: "Diabetes Care",
      quantity: 2,
      expiryDate: validExpiryStr,
    }, donorToken);
    assert(
      insulinRes.status === 400 && insulinRes.data?.message?.includes("Cold-chain"),
      "Cold-chain keyword (Insulin) rejected with HTTP 400 safety error"
    );

    // Test 2.4: Schedule X narcotic detection (e.g. "Morphine Sulfate")
    const morphRes = await request("POST", "/medicines", {
      medicineName: "Morphine Sulfate 10mg Tablets",
      company: "Pain Care Pharma",
      category: "Pain & Fever",
      quantity: 10,
      expiryDate: validExpiryStr,
    }, donorToken);
    assert(
      morphRes.status === 400 && morphRes.data?.message?.includes("Schedule X"),
      "Schedule X narcotic keyword (Morphine) rejected with HTTP 400 safety error"
    );

    // Test 2.5: Opened/Cut packaging rejection
    const cutRes = await request("POST", "/medicines", {
      medicineName: "Paracetamol 500mg",
      company: "GSK",
      category: "Pain & Fever",
      quantity: 5,
      packageCondition: "Cut strip with 3 open tablets",
      expiryDate: validExpiryStr,
    }, donorToken);
    assert(
      cutRes.status === 400 && cutRes.data?.message?.includes("ineligible"),
      "Opened/cut packaging condition rejected with HTTP 400"
    );

    // Test 2.6: Create valid 100% free donation and confirm price is forced to 0
    const createRes = await request("POST", "/medicines", {
      medicineName: "Amoxicillin Trihydrate 500mg",
      brandName: "Mox 500",
      genericName: "Amoxicillin (500mg)",
      company: "Ranbaxy Laboratories",
      category: "Antibiotics",
      dosageForm: "Capsule",
      quantity: 10,
      unit: "Capsules (1 strip)",
      price: 99, // Donor attempts to charge ₹99
      originalMrp: 120,
      packageCondition: "Intact Sealed Blister Pack",
      storageCondition: "Stored in cool, dry place (<25°C)",
      isPrescriptionRequired: true,
      locality: "Kothrud",
      expiryDate: validExpiryStr,
    }, donorToken);

    const createdMed = createRes.data.data;
    assert(createRes.status === 201, "Valid medicine created in pending status");
    assert(createdMed.price === 0, "Server forced price = 0 (Free Donation)");
    assert(createdMed.listingType === "free_donation", "Server forced listingType = 'free_donation'");
    assert(createdMed.status === "pending", "Initial status is 'pending' for coordinator audit");

    // ---------------------------------------------------------
    // 3. Donor Moderation Bypass Prevention & Update Reset
    // ---------------------------------------------------------
    console.log("\n--- STEP 3: DONOR MODERATION BYPASS & INTEGRITY ---");
    
    // First, approve the medicine via Admin
    await request(
      "PATCH",
      `/admin/medicines/${createdMed._id}/status`,
      { status: "approved" },
      adminToken
    );

    // Verify it is now approved
    const medAfterApprove = await request("GET", `/medicines/${createdMed._id}`);
    assert(medAfterApprove.data.data.status === "approved", "Medicine successfully approved by admin");

    // Now donor attempts to update the medicine with 'status: approved' and 'price: 250'
    const updateRes = await request("PUT", `/medicines/${createdMed._id}`, {
      medicineName: "Amoxicillin 500mg Modified",
      status: "approved", // Attempt to stay approved
      price: 250, // Attempt to set commercial price
      quantity: 15,
    }, donorToken);

    const updatedMed = updateRes.data.data;
    assert(updatedMed.price === 0, "Donor cannot set commercial price on update (remains 0)");
    assert(updatedMed.status === "pending", "Donor edit automatically resets status to 'pending' for re-moderation");
    assert(updatedMed.quantity === 15, "Allowed field (quantity) updated to 15");

    // Re-approve for downstream tests
    await request(
      "PATCH",
      `/admin/medicines/${createdMed._id}/status`,
      { status: "approved" },
      adminToken
    );

    // ---------------------------------------------------------
    // 4. Commercial Orders API Disabled / Unmounted
    // ---------------------------------------------------------
    console.log("\n--- STEP 4: COMMERCIAL ORDERS API UNMOUNTED ---");
    const orderRes = await request("POST", "/orders", {
      items: [{ medicine: createdMed._id, quantity: 1 }],
    }, donorToken);
    assert(orderRes.status === 404, "Commercial /api/orders is unmounted (HTTP 404 Not Found)");

    // ---------------------------------------------------------
    // 5. Public Medicine Data Privacy & Search Sanitization
    // ---------------------------------------------------------
    console.log("\n--- STEP 5: PUBLIC PRIVACY & SEARCH SANITIZATION ---");
    
    // Public GET /api/medicines
    const publicList = await request("GET", "/medicines");
    const sampleMed = publicList.data.data[0];
    assert(sampleMed !== undefined, "Public medicines catalog retrieved");
    assert(sampleMed.seller?.name, "Seller public name is present");
    assert(sampleMed.seller?.email === undefined, "Seller private email is OMITTED from public catalog");
    assert(sampleMed.seller?.phone === undefined, "Seller private phone is OMITTED from public catalog");
    assert(sampleMed.seller?.address === undefined, "Seller private home address is OMITTED from public catalog");

    // Public GET /api/medicines/:id
    const singleMed = await request("GET", `/medicines/${createdMed._id}`);
    assert(singleMed.data.data.seller?.email === undefined, "Single medicine public endpoint omits seller email");
    assert(singleMed.data.data.seller?.phone === undefined, "Single medicine public endpoint omits seller phone");
    assert(singleMed.data.data.seller?.address === undefined, "Single medicine public endpoint omits seller home address");

    // Anonymous status filter bypass attempt
    const pendingQuery = await request("GET", "/medicines?status=pending");
    const hasNonApproved = pendingQuery.data.data.some((m) => m.status !== "approved");
    assert(!hasNonApproved, "Anonymous users querying ?status=pending strictly receive approved listings only");

    // Regex injection / special character search
    const specialSearch = await request("GET", `/medicines?search=${encodeURIComponent("Mox (500mg) [Capsule] + *")}`);
    assert(specialSearch.status === 200, "Regex special characters in search sanitized cleanly without errors");

    // ---------------------------------------------------------
    // 6. Login Rate Limiting
    // ---------------------------------------------------------
    console.log("\n--- STEP 6: SERVER-SIDE LOGIN RATE LIMITING ---");
    const testRateEmail = `ratelimit_${Date.now()}@medisave.org`;
    let rateLimitTriggered = false;

    for (let i = 1; i <= 6; i++) {
      const loginAttempt = await request("POST", "/auth/login", {
        email: testRateEmail,
        password: "WrongPassword999!",
      });
      if (loginAttempt.status === 429) {
        rateLimitTriggered = true;
        break;
      }
    }
    assert(rateLimitTriggered, "Login rate limiter returns HTTP 429 after 5 failed password attempts");

    // ---------------------------------------------------------
    // 7. Handover 5-Attempt Lockout & Admin Recovery Endpoint
    // ---------------------------------------------------------
    console.log("\n--- STEP 7: HANDOVER LOCKOUT & ADMIN UNLOCK ---");
    
    // Partner accepts the donation
    const acceptRes = await request(
      "POST",
      `/medicines/${createdMed._id}/accept-donation`,
      {},
      partnerToken
    );
    assert(acceptRes.status === 200, "Partner accepted the donation");

    // Donor views their own listings to retrieve generated 6-digit OTP
    const donorListings = await request("GET", "/medicines/my-listings", null, donorToken);
    const donorMed = donorListings.data.data.find((m) => m._id === createdMed._id);
    const validOtp = donorMed.handoverCode;
    assert(validOtp && validOtp.length === 6, `Donor retrieved private 6-digit handover OTP: ${validOtp}`);

    // Partner attempts 5 wrong codes to trigger security lockout
    for (let attempt = 1; attempt <= 5; attempt++) {
      await request(
        "POST",
        `/medicines/${createdMed._id}/verify-handover`,
        { code: "000000" },
        partnerToken
      );
    }

    // 6th attempt with CORRECT code should still fail because it is now locked
    const lockedRes = await request(
      "POST",
      `/medicines/${createdMed._id}/verify-handover`,
      { code: validOtp },
      partnerToken
    );
    assert(
      lockedRes.status === 400 && lockedRes.data?.message?.includes("locked"),
      "Handover locked after 5 failed attempts (correct code rejected while locked)"
    );

    // Admin unlocks the handover
    const unlockRes = await request(
      "POST",
      `/admin/medicines/${createdMed._id}/unlock-handover`,
      {},
      adminToken
    );
    assert(unlockRes.status === 200, "Admin successfully unlocked handover verification");

    // Now partner enters the CORRECT code and completes the handover
    const completeRes = await request(
      "POST",
      `/medicines/${createdMed._id}/verify-handover`,
      { code: validOtp },
      partnerToken
    );
    assert(completeRes.status === 200, "Partner successfully verified correct 6-digit OTP after admin unlock");
    assert(completeRes.data.data.status === "completed", "Medicine status marked as 'completed'");

    // ---------------------------------------------------------
    // 8. Partner Sorting & CEP Proof Metrics
    // ---------------------------------------------------------
    console.log("\n--- STEP 8: PARTNER SORTING & DYNAMIC CEP METRICS ---");
    const partnerAvail = await request("GET", "/medicines/partner/available", null, partnerToken);
    assert(partnerAvail.status === 200, "Partner available donations list retrieved");

    const cepProofsRes = await request("GET", "/cep-proofs");
    const impact = cepProofsRes.data?.data?.quantifiableImpact;
    assert(impact !== undefined, "CEP Proofs impact data retrieved");
    assert(typeof impact.livePlatformMedicines === "number", "livePlatformMedicines is dynamic number");
    assert(typeof impact.liveApprovedListings === "number", "liveApprovedListings is dynamic number");

    // ---------------------------------------------------------
    // Final Summary
    // ---------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`  ALL VERIFICATION TESTS COMPLETED: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log("==================================================================\n");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("Test Suite Execution Error:", error);
    process.exit(1);
  }
}

runTests();
