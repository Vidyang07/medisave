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

async function runSellerOrderManagementTests() {
  console.log("===============================================================");
  console.log("MEDISAVE — SELLER ORDER MANAGEMENT AUTOMATED VERIFICATION SUITE");
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
    // Setup: Create 3 users: Seller A, Seller B, Buyer, Unrelated User
    // -------------------------------------------------------------
    console.log("--- Setup: Registering Test Users ---");
    const regSellerA = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Aarti Kulkarni (Seller A)",
        email: `seller_a_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822000001",
        address: "Kothrud, Pune",
      },
    });
    const sellerAToken = regSellerA.data?.data?.token;
    const sellerAId = regSellerA.data?.data?.user?._id;

    const regSellerB = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Bipin Joshi (Seller B)",
        email: `seller_b_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822000002",
        address: "Deccan, Pune",
      },
    });
    const sellerBToken = regSellerB.data?.data?.token;
    const sellerBId = regSellerB.data?.data?.user?._id;

    const regBuyer = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Smt. Shaila Patil (Buyer)",
        email: `buyer_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822000003",
        address: "Aundh, Pune",
      },
    });
    const buyerToken = regBuyer.data?.data?.token;
    const buyerId = regBuyer.data?.data?.user?._id;

    const regUnrelated = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Mr. Unrelated User",
        email: `unrelated_${ts}@test.medisave.org`,
        password: "Password123!",
        phone: "9822000004",
        address: "Baner, Pune",
      },
    });
    const unrelatedToken = regUnrelated.data?.data?.token;

    assert(sellerAToken && sellerBToken && buyerToken && unrelatedToken, "All 4 test user accounts created successfully");

    // -------------------------------------------------------------
    // Setup Listings: Seller A lists Med A, Seller B lists Med B
    // -------------------------------------------------------------
    console.log("\n--- Setup: Creating Medicine Listings ---");
    const medARes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: {
        medicineName: "Paracetamol 650mg",
        brandName: "Dolo 650",
        company: "Micro Labs",
        category: "Pain & Fever",
        strength: "650 mg",
        quantity: 20,
        price: 30,
        originalMrp: 60,
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const medA = medARes.data?.data;

    const medBRes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerBToken}` },
      body: {
        medicineName: "Azithromycin 500mg",
        brandName: "Azee 500",
        company: "Cipla",
        category: "Antibiotics",
        strength: "500 mg",
        quantity: 15,
        price: 90,
        originalMrp: 180,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const medB = medBRes.data?.data;

    // Approve medicines in MongoDB so buyer can purchase them
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: Medicine } = await import("../backend/models/Medicine.js");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }
    await Medicine.updateMany({ _id: { $in: [medA._id, medB._id] } }, { status: "approved" });

    assert(medA?._id && medB?._id, "Seller A created Med A, Seller B created Med B");

    // -------------------------------------------------------------
    // Test 1 & 2: Multi-Seller Order Creation and Seller Order Retrieval & Isolation
    // -------------------------------------------------------------
    console.log("\n--- Test 1 & 2: Order Creation and Seller Retrieval Isolation ---");
    const orderRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [
          { medicineId: medA._id, quantity: 2 }, // Seller A: 2 * 30 = 60
          { medicineId: medB._id, quantity: 3 }, // Seller B: 3 * 90 = 270
        ],
        shippingAddress: {
          fullName: "Smt. Shaila Patil",
          phone: "9822000003",
          address: "Flat 101, Aundh Heights",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411007",
        },
      },
    });

    const order1 = orderRes.data?.data;
    assert(orderRes.status === 201, "Buyer placed multi-seller order successfully");
    assert(order1.status === "pending", "Initial order status is 'pending'");

    // Seller A retrieves seller orders
    const sellerAOrdersRes = await request("/orders/seller-orders", {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    assert(sellerAOrdersRes.status === 200, "Seller A can retrieve incoming orders via GET /api/orders/seller-orders");
    assert(sellerAOrdersRes.data?.count === 1, "Seller A receives 1 order in their incoming list");

    const sellerAOrderData = sellerAOrdersRes.data?.data[0];
    assert(
      sellerAOrderData?.items?.length === 1 && sellerAOrderData.items[0].medicineName === "Paracetamol 650mg",
      "Seller A ONLY sees their own item (Dolo 650) and NOT Seller B's item"
    );
    assert(sellerAOrderData?.sellerSubtotal === 60, "Seller A sees correct seller subtotal of ₹60");

    // Seller B retrieves seller orders
    const sellerBOrdersRes = await request("/orders/seller-orders", {
      headers: { Authorization: `Bearer ${sellerBToken}` },
    });
    assert(sellerBOrdersRes.status === 200, "Seller B can retrieve incoming orders");
    const sellerBOrderData = sellerBOrdersRes.data?.data[0];
    assert(
      sellerBOrderData?.items?.length === 1 && sellerBOrderData.items[0].medicineName === "Azithromycin 500mg",
      "Seller B ONLY sees their own item (Azee 500) and NOT Seller A's item"
    );
    assert(sellerBOrderData?.sellerSubtotal === 270, "Seller B sees correct seller subtotal of ₹270");

    // Unrelated user tries to retrieve seller orders -> returns 0 orders
    const unrelatedOrdersRes = await request("/orders/seller-orders", {
      headers: { Authorization: `Bearer ${unrelatedToken}` },
    });
    assert(unrelatedOrdersRes.data?.count === 0, "Unrelated user receives 0 orders in seller-orders");

    // Unauthenticated request to /seller-orders -> 401
    const unauthSellerOrdersRes = await request("/orders/seller-orders");
    assert(unauthSellerOrdersRes.status === 401, "Unauthenticated GET /seller-orders rejected with 401");

    // -------------------------------------------------------------
    // Test 3, 4, 5, 6: Order Lifecycle Progression (pending -> confirmed -> processing -> shipped -> delivered)
    // -------------------------------------------------------------
    console.log("\n--- Tests 3-6: Sequential Lifecycle State Transitions ---");

    // Test 3: pending -> confirmed
    const confirmRes = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "confirmed", itemId: order1.items[0]._id },
    });
    assert(confirmRes.status === 200, "Seller A successfully confirms their item (pending -> confirmed)");

    // Test 4: confirmed -> processing
    const processingRes = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "processing", itemId: order1.items[0]._id },
    });
    assert(processingRes.status === 200, "Seller A successfully moves item to processing (confirmed -> processing)");

    // Test 5: processing -> shipped
    const shippedRes = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "shipped", itemId: order1.items[0]._id },
    });
    assert(shippedRes.status === 200, "Seller A successfully moves item to shipped (processing -> shipped)");

    // Test 6: shipped -> delivered
    const deliveredRes = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "delivered", itemId: order1.items[0]._id },
    });
    assert(deliveredRes.status === 200, "Seller A successfully moves item to delivered (shipped -> delivered)");

    // -------------------------------------------------------------
    // Test 7: Invalid Status Transitions are Blocked (400 Bad Request)
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Invalid Status Transitions Enforcement ---");

    // Try transitioning a delivered item back to pending
    const invalidDeliveredToPending = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "pending", itemId: order1.items[0]._id },
    });
    assert(
      invalidDeliveredToPending.status === 400 && invalidDeliveredToPending.data?.message?.includes("Invalid status transition"),
      `Blocked invalid transition (delivered -> pending) with 400: "${invalidDeliveredToPending.data?.message}"`
    );

    // Try transitioning a delivered item to confirmed
    const invalidDeliveredToConfirmed = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "confirmed", itemId: order1.items[0]._id },
    });
    assert(invalidDeliveredToConfirmed.status === 400, "Blocked invalid transition (delivered -> confirmed) with 400");

    // Try skipping states on Seller B's item (currently 'pending' -> 'delivered')
    const invalidPendingToDelivered = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerBToken}` },
      body: { status: "delivered", itemId: order1.items[1]._id },
    });
    assert(
      invalidPendingToDelivered.status === 400,
      `Blocked invalid state skip (pending -> delivered) with 400: "${invalidPendingToDelivered.data?.message}"`
    );

    // -------------------------------------------------------------
    // Test 8 & 9: Buyer View and Status Dynamic Visibility
    // -------------------------------------------------------------
    console.log("\n--- Tests 8 & 9: Buyer View and Real-Time Status Updates ---");

    const buyerOrdersRes = await request("/orders/my-orders", {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(buyerOrdersRes.status === 200 && buyerOrdersRes.data?.count === 1, "Buyer can retrieve order history");

    const buyerOrderData = buyerOrdersRes.data?.data[0];
    const item1 = buyerOrderData.items.find((i) => i.medicineName === "Paracetamol 650mg");
    const item2 = buyerOrderData.items.find((i) => i.medicineName === "Azithromycin 500mg");
    assert(item1?.status === "delivered", "Buyer sees item 1 status as 'delivered'");
    assert(item2?.status === "pending", "Buyer sees item 2 status as 'pending'");

    // -------------------------------------------------------------
    // Test 10 & 11: Authorization & Cross-Seller Modification Restrictions
    // -------------------------------------------------------------
    console.log("\n--- Tests 10 & 11: Cross-Seller & Unauthorized Modification Protection ---");

    // Unauthenticated PATCH -> 401
    const unauthPatch = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      body: { status: "confirmed" },
    });
    assert(unauthPatch.status === 401, "Unauthenticated PATCH /api/orders/:id/status rejected with 401");

    // Unrelated user tries to update status -> 403 Forbidden
    const unrelatedPatch = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${unrelatedToken}` },
      body: { status: "confirmed" },
    });
    assert(unrelatedPatch.status === 403, "Unrelated user PATCH /api/orders/:id/status rejected with 403");

    // Seller A tries to update Seller B's item -> 403 Forbidden
    const sellerACrossModify = await request(`/orders/${order1._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "confirmed", itemId: order1.items[1]._id },
    });
    assert(
      sellerACrossModify.status === 403 && sellerACrossModify.data?.message?.includes("another seller"),
      `Seller A attempting to modify Seller B's item blocked with 403: "${sellerACrossModify.data?.message}"`
    );

    // Nonexistent order ID -> 404
    const nonexistentOrderId = "507f1f77bcf86cd799439011";
    const nonexistentPatch = await request(`/orders/${nonexistentOrderId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: { status: "confirmed" },
    });
    assert(nonexistentPatch.status === 404, "Nonexistent order status update returns 404 Not Found");

    // -------------------------------------------------------------
    // Test 12: Cancellation & Inventory Restoration (No Duplicate Restores)
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Cancellation and Single Inventory Restoration ---");

    // Create a new fresh single-item order for cancellation test
    const cancelTestMedRes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: {
        medicineName: "Cetirizine 10mg",
        company: "Dr. Reddy's",
        category: "Allergy",
        quantity: 10,
        price: 25,
        originalMrp: 50,
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const cancelMed = cancelTestMedRes.data?.data;
    await Medicine.findByIdAndUpdate(cancelMed._id, { status: "approved" });
    assert(cancelMed?.quantity === 10, "Created medicine listing with 10 units");

    // Buyer orders 4 units -> Stock becomes 6
    const cancelOrderRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId: cancelMed._id, quantity: 4 }],
        shippingAddress: {
          fullName: "Smt. Shaila Patil",
          phone: "9822000003",
          address: "Flat 101, Aundh Heights",
          city: "Pune",
        },
      },
    });
    const cancelOrder = cancelOrderRes.data?.data;
    assert(cancelOrderRes.status === 201, "Order placed for 4 units");

    const medAfterOrder = await request(`/medicines/${cancelMed._id}`);
    assert(medAfterOrder.data?.data?.quantity === 6, "Stock decreased to 6 after order");

    // Buyer cancels order -> Stock restored to 10
    const cancel1Res = await request(`/orders/${cancelOrder._id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: { reason: "Customer changed mind" },
    });
    assert(cancel1Res.status === 200, "Order cancelled successfully");

    const medAfterCancel1 = await request(`/medicines/${cancelMed._id}`);
    assert(medAfterCancel1.data?.data?.quantity === 10, "Stock restored from 6 to 10");

    // Attempt second cancellation on already cancelled order -> Must fail with 400
    const cancel2Res = await request(`/orders/${cancelOrder._id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: { reason: "Duplicate cancel attempt" },
    });
    assert(
      cancel2Res.status === 400 && cancel2Res.data?.message?.includes("already marked as \"cancelled\""),
      `Second cancel rejected with 400: "${cancel2Res.data?.message}"`
    );

    // Verify stock was NOT restored again (remains 10, not 14)
    const medAfterCancel2 = await request(`/medicines/${cancelMed._id}`);
    assert(medAfterCancel2.data?.data?.quantity === 10, "Stock remains 10 (NOT doubled to 14)");

    // -------------------------------------------------------------
    // Test 13 & 14: Verification that Medicine CRUD and Order API tests pass
    // -------------------------------------------------------------
    console.log("\n--- Tests 13 & 14: Medicine Search & CRUD Integrity ---");
    const searchRes = await request("/medicines?search=Paracetamol");
    assert(searchRes.data?.count >= 1, "Public medicine search works correctly");

    const filterCategoryRes = await request("/medicines?category=Antibiotics");
    assert(filterCategoryRes.data?.count >= 1, "Category filter works correctly");

    const sellerListingsRes = await request("/medicines/my-listings", {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    assert(sellerListingsRes.data?.count >= 2, "Seller can retrieve their own listings via GET /api/medicines/my-listings");

  } catch (err) {
    console.error("Test Suite encountered an exception:", err);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(`SELLER ORDER MANAGEMENT VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSellerOrderManagementTests();
