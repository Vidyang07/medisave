const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => null);

  return {
    status: res.status,
    ok: res.ok,
    data,
  };
}

async function runAdminModerationTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — ADMIN MODERATION SYSTEM AUTOMATED TEST SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

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
    // Step 1: Create Admin, Seller, and Buyer Users
    // -------------------------------------------------------------
    console.log("1. Setting up Test Users (Admin, Seller, Buyer)...");
    
    // Create Admin User (we will register and then promote to admin directly or verify)
    const adminReg = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Ramesh Patel (Chief Admin)",
        email: `admin_${ts}@test.medisave.org`,
        password: "AdminPassword123!",
        phone: "9822999999",
        address: "Shivaji Nagar, Pune",
      },
    });
    const adminId = adminReg.data?.data?.user?._id;
    let adminToken = adminReg.data?.data?.token;

    // Direct DB update to set role: "admin" for test admin
    // We can do this via Mongoose or using an admin script
    const sellerReg = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Smt. Meena Deshmukh (Seller)",
        email: `seller_mod_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822111111",
        address: "Kothrud, Pune",
      },
    });
    const sellerToken = sellerReg.data?.data?.token;

    const buyerReg = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Mr. Anand Rathi (Buyer)",
        email: `buyer_mod_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822222222",
        address: "Deccan, Pune",
      },
    });
    const buyerToken = buyerReg.data?.data?.token;

    assert(adminToken && sellerToken && buyerToken, "Created test accounts for Admin, Seller, and Buyer");

    // Promote admin user in MongoDB
    // Import User model via node helper if needed or via mongo
    // Let's use a quick node runner or internal script to promote adminId
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: User } = await import("../backend/models/User.js");
    const { default: Medicine } = await import("../backend/models/Medicine.js");
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }
    await User.findByIdAndUpdate(adminId, { role: "admin", isVerified: true });
    await mongoose.disconnect();
    
    // Re-login as admin to get fresh token with admin role
    const adminLoginRes = await request("/auth/login", {
      method: "POST",
      body: {
        email: `admin_${ts}@test.medisave.org`,
        password: "AdminPassword123!",
      },
    });
    adminToken = adminLoginRes.data?.data?.token;
    assert(adminLoginRes.data?.data?.user?.role === "admin", "Admin role promoted and verified");

    // -------------------------------------------------------------
    // Step 2: Non-Admin Access Control Verification (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n2. Testing Non-Admin Access Controls...");
    
    const unauthStats = await request("/admin/stats");
    assert(unauthStats.status === 401, "Unauthenticated access to /admin/stats rejected with 401");

    const sellerStats = await request("/admin/stats", {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerStats.status === 403, "Seller accessing /admin/stats rejected with 403 Forbidden");

    const sellerMedicines = await request("/admin/medicines", {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerMedicines.status === 403, "Seller accessing /admin/medicines rejected with 403 Forbidden");

    // -------------------------------------------------------------
    // Step 3: Admin Overview Stats
    // -------------------------------------------------------------
    console.log("\n3. Testing Admin Stats Overview (GET /api/admin/stats)...");
    const adminStatsRes = await request("/admin/stats", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStatsRes.status === 200, "Admin can retrieve platform statistics");
    assert(adminStatsRes.data?.data?.users?.total >= 3, "Stats include user counts");
    assert(adminStatsRes.data?.data?.medicines !== undefined, "Stats include medicine counts");
    assert(adminStatsRes.data?.data?.orders !== undefined, "Stats include order counts");

    // -------------------------------------------------------------
    // Step 4: Seller Creates a Listing -> Starts in 'pending' status
    // -------------------------------------------------------------
    console.log("\n4. Testing Listing Creation Workflow (Seller creates -> PENDING)...");
    const uniqueMedName = `Ibuprofen 400mg ModTest ${ts}`;
    const createMedRes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: {
        medicineName: uniqueMedName,
        brandName: "Brufen 400",
        company: "Abbott India",
        category: "Pain & Fever",
        strength: "400 mg",
        quantity: 12,
        price: 40,
        originalMrp: 85,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: "AB-BR4001",
        packageCondition: "Intact Sealed Blister Pack",
      },
    });

    const pendingMed = createMedRes.data?.data;
    assert(createMedRes.status === 201, "Medicine listing submitted by seller");
    assert(pendingMed.status === "pending", "Newly created listing defaults to 'pending' status");

    // -------------------------------------------------------------
    // Step 5: Unapproved (Pending) Medicine is NOT in Public Marketplace
    // -------------------------------------------------------------
    console.log("\n5. Verifying Pending Medicine is Hidden from Public Marketplace...");
    const publicCatalogRes = await request(`/medicines?search=${encodeURIComponent(uniqueMedName)}`);
    const foundInPublic = publicCatalogRes.data?.data?.some((m) => m._id === pendingMed._id);
    assert(!foundInPublic, "Pending medicine is NOT visible to public buyers in marketplace");

    // Buyer attempts to purchase pending medicine -> Must fail (400)
    const buyPendingRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId: pendingMed._id, quantity: 1 }],
        shippingAddress: {
          fullName: "Mr. Anand Rathi",
          phone: "9822222222",
          address: "Deccan Gymkhana",
          city: "Pune",
        },
      },
    });
    assert(
      buyPendingRes.status === 400 && buyPendingRes.data?.message?.includes("unavailable"),
      `Purchase attempt on unapproved medicine rejected with 400: "${buyPendingRes.data?.message}"`
    );

    // -------------------------------------------------------------
    // Step 6: Admin Reviews Pending Queue and Approves Listing
    // -------------------------------------------------------------
    console.log("\n6. Testing Admin Moderation Approval (PENDING -> APPROVED)...");
    const adminPendingRes = await request("/admin/medicines?status=pending", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPendingRes.status === 200, "Admin can retrieve pending moderation queue");
    const foundInAdminQueue = adminPendingRes.data?.data?.some((m) => m._id === pendingMed._id);
    assert(foundInAdminQueue, "New submission appears in admin pending queue");

    // Admin approves the listing
    const approveRes = await request(`/admin/medicines/${pendingMed._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: "approved" },
    });
    assert(approveRes.status === 200, "Admin successfully approved medicine listing");
    assert(approveRes.data?.data?.status === "approved", "Medicine status updated to 'approved'");

    // -------------------------------------------------------------
    // Step 7: Approved Medicine is Now Available in Public Marketplace
    // -------------------------------------------------------------
    console.log("\n7. Verifying Approved Medicine is Live in Public Marketplace...");
    const publicApprovedRes = await request(`/medicines?search=${encodeURIComponent(uniqueMedName)}`);
    const foundInPublicAfterApproval = publicApprovedRes.data?.data?.some((m) => m._id === pendingMed._id);
    assert(foundInPublicAfterApproval, "Approved medicine is immediately live in public marketplace");

    // Buyer can now purchase the approved medicine
    const buyApprovedRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId: pendingMed._id, quantity: 2 }],
        shippingAddress: {
          fullName: "Mr. Anand Rathi",
          phone: "9822222222",
          address: "Deccan Gymkhana",
          city: "Pune",
        },
      },
    });
    assert(buyApprovedRes.status === 201, "Buyer successfully placed order for approved medicine");

    // -------------------------------------------------------------
    // Step 8: Admin Rejection Workflow (PENDING -> REJECTED with Reason)
    // -------------------------------------------------------------
    console.log("\n8. Testing Admin Rejection Workflow with Rejection Reason...");
    const rejectMedRes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: {
        medicineName: `Suspicious Med ${ts}`,
        company: "Unknown Lab",
        category: "Other",
        quantity: 5,
        price: 10,
        originalMrp: 20,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const rejectMed = rejectMedRes.data?.data;

    const adminRejectRes = await request(`/admin/medicines/${rejectMed._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: "rejected",
        rejectionReason: "Damaged blister foil and illegible manufacturer batch stamp",
      },
    });
    assert(adminRejectRes.status === 200, "Admin rejected suspicious listing");
    assert(adminRejectRes.data?.data?.status === "rejected", "Listing status marked as 'rejected'");
    assert(
      adminRejectRes.data?.data?.rejectionReason?.includes("Damaged blister foil"),
      "Rejection reason persisted on medicine document"
    );

    // -------------------------------------------------------------
    // Step 9: Admin User Verification & Platform Orders Oversight
    // -------------------------------------------------------------
    console.log("\n9. Testing Admin User Verification and Platform Orders...");
    const adminUsersRes = await request("/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUsersRes.status === 200 && adminUsersRes.data?.data?.length >= 3, "Admin can retrieve platform users");

    // Toggle seller verification
    const toggleVerifyRes = await request(`/admin/users/${sellerReg.data.data.user._id}/verify`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isVerified: true },
    });
    assert(toggleVerifyRes.status === 200 && toggleVerifyRes.data?.data?.isVerified === true, "Admin verified seller member account");

    // Admin platform orders
    const adminOrdersRes = await request("/admin/orders", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOrdersRes.status === 200 && adminOrdersRes.data?.count >= 1, "Admin can retrieve all platform orders");

    // -------------------------------------------------------------
    // Step 10: Admin Permanent Deletion
    // -------------------------------------------------------------
    console.log("\n10. Testing Admin Deletion...");
    const deleteRes = await request(`/admin/medicines/${rejectMed._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, "Admin permanently deleted rejected listing");

    const verifyDeleted = await request(`/medicines/${rejectMed._id}`);
    assert(verifyDeleted.status === 404, "Deleted medicine is completely removed from database");

  } catch (error) {
    console.error("Admin Moderation Test Suite error:", error);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(`ADMIN MODERATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdminModerationTests();
