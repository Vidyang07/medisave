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

async function runOrderTests() {
  console.log("=== STARTING CART + ORDER API TEST SUITE ===\n");
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

  try {
    const timestamp = Date.now();

    // 1. Setup 2 users: Seller and Buyer
    console.log("1. Setting up Test Users (Seller & Buyer)...");
    const sellerRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Dr. Seller User",
        email: `seller_${timestamp}@example.com`,
        password: "Password123!",
        phone: "9876543210",
        address: "Shivaji Nagar, Pune",
      },
    });
    const sellerToken = sellerRes.data?.data?.token;
    const sellerId = sellerRes.data?.data?.user?._id;

    const buyerRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Mr. Buyer User",
        email: `buyer_${timestamp}@example.com`,
        password: "Password123!",
        phone: "9123456780",
        address: "Kothrud, Pune",
      },
    });
    const buyerToken = buyerRes.data?.data?.token;
    const buyerId = buyerRes.data?.data?.user?._id;
    assert(sellerToken && buyerToken, "Created Seller and Buyer accounts with JWT tokens");

    // 2. Seller lists a medicine with Quantity: 5, Price: Rs 150 (MRP: Rs 300)
    console.log("\n2. Seller listing medicine...");
    const medRes = await request("/medicines", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: {
        medicineName: "Amoxicillin 500mg Test",
        company: "Sun Pharma",
        category: "Antibiotics",
        price: 150,
        originalMrp: 300,
        quantity: 5,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const medicine = medRes.data?.data;
    const medicineId = medicine?._id || medicine?.id;

    // Approve medicine in MongoDB for checkout test
    const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
    const { default: Medicine } = await import("../backend/models/Medicine.js");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }
    await Medicine.findByIdAndUpdate(medicineId, { status: "approved" });

    assert(medicine && medicine.quantity === 5 && medicine.price === 150, "Medicine listed with stock: 5, price: 150");

    // 3. Unauthenticated user cannot create order
    console.log("\n3. Testing unauthenticated order creation...");
    const unauthOrderRes = await request("/orders", {
      method: "POST",
      body: {
        items: [{ medicineId, quantity: 1 }],
        shippingAddress: {
          fullName: "Anonymous",
          phone: "9876543210",
          address: "Somewhere",
          city: "Pune",
        },
      },
    });
    assert(unauthOrderRes.status === 401, "Unauthenticated order rejected with 401 Unauthorized");

    // 4. Seller attempts to purchase their own listing -> Should fail (400)
    console.log("\n4. Testing self-purchase prevention...");
    const selfPurchaseRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: {
        items: [{ medicineId, quantity: 1 }],
        shippingAddress: {
          fullName: "Dr. Seller User",
          phone: "9876543210",
          address: "Shivaji Nagar, Pune",
          city: "Pune",
        },
      },
    });
    assert(
      selfPurchaseRes.status === 400 && selfPurchaseRes.data?.message?.includes("own medicine"),
      `Self-purchase blocked with 400: "${selfPurchaseRes.data?.message}"`
    );

    // 5. Buyer creates order for 2 units, passing fake/spoofed client price Rs 1
    console.log("\n5. Testing order creation with spoofed price (server-side pricing enforcement)...");
    const orderRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [
          {
            medicineId,
            quantity: 2,
            price: 1, // Malicious spoofed price
            total: 2,
          },
        ],
        shippingAddress: {
          fullName: "Mr. Buyer User",
          phone: "9123456780",
          address: "Kothrud, Pune",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411038",
        },
      },
    });

    const createdOrder = orderRes.data?.data;
    assert(orderRes.status === 201, "Order created with 201 Created");
    assert(createdOrder.items[0].price === 150, `Item price calculated from DB (₹150, not ₹1 spoof)`);
    assert(createdOrder.subtotal === 300, `Order subtotal correctly computed as ₹300 (2 * 150)`);
    assert(createdOrder.shippingFee === 0, `Free shipping applied on subtotal >= 200 (fee: ₹${createdOrder.shippingFee})`);
    assert(createdOrder.totalAmount === 300, `Grand total correctly computed as ₹300`);
    assert(createdOrder.status === "pending", `Order initial status is 'pending'`);

    // 6. Check that inventory decreased from 5 to 3
    console.log("\n6. Checking inventory decrement...");
    const medAfterOrder = await request(`/medicines/${medicineId}`);
    assert(medAfterOrder.data?.data?.quantity === 3, `Stock decreased correctly from 5 to 3`);
    assert(medAfterOrder.data?.data?.status === "approved", `Stock remaining > 0, status is still 'approved'`);

    // 7. Buyer attempts to purchase 10 units (stock is 3) -> Should fail (400)
    console.log("\n7. Testing over-purchasing beyond stock...");
    const overPurchaseRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId, quantity: 10 }],
        shippingAddress: {
          fullName: "Mr. Buyer User",
          phone: "9123456780",
          address: "Kothrud, Pune",
          city: "Pune",
        },
      },
    });
    assert(
      overPurchaseRes.status === 400 && overPurchaseRes.data?.message?.includes("exceeds available stock"),
      `Over-purchase blocked with 400: "${overPurchaseRes.data?.message}"`
    );

    // 8. Buyer retrieves their orders
    console.log("\n8. Testing GET /api/orders/my-orders...");
    const myOrdersRes = await request("/orders/my-orders", {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(myOrdersRes.data?.success && myOrdersRes.data?.count >= 1, `Retrieved ${myOrdersRes.data?.count} order(s) for buyer`);
    assert(myOrdersRes.data?.data[0]?._id === createdOrder._id, `First order matches created order ID`);

    // 9. Third-party user attempts to view Buyer's order details -> Forbidden (403)
    console.log("\n9. Testing unauthorized access to order...");
    const thirdPartyRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Third Party User",
        email: `thirdparty_${timestamp}@example.com`,
        password: "Password123!",
        phone: "9000000000",
        address: "Viman Nagar, Pune",
      },
    });
    const thirdPartyToken = thirdPartyRes.data?.data?.token;

    const unauthorizedAccessRes = await request(`/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${thirdPartyToken}` },
    });
    assert(unauthorizedAccessRes.status === 403, `Third-party access blocked with 403 Forbidden`);

    // 10. Buyer views single order details
    console.log("\n10. Testing Buyer GET /api/orders/:id...");
    const singleOrderRes = await request(`/orders/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(singleOrderRes.data?.success && singleOrderRes.data?.data?._id === createdOrder._id, "Buyer can view their order details");

    // 11. Buyer cancels the order -> Verify cancellation and inventory restoration
    console.log("\n11. Testing PATCH /api/orders/:id/cancel and inventory restoration...");
    const cancelRes = await request(`/orders/${createdOrder._id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: { reason: "Ordered by mistake, re-ordering different dosage" },
    });
    assert(cancelRes.data?.success && cancelRes.data?.data?.status === "cancelled", "Order status successfully updated to 'cancelled'");

    // Check inventory restored back to 5
    const medAfterCancel = await request(`/medicines/${medicineId}`);
    assert(medAfterCancel.data?.data?.quantity === 5, `Inventory restored from 3 back to original 5`);

    // 12. Buyer purchases remaining 5 units -> Stock becomes 0 and status becomes 'sold'
    console.log("\n12. Testing full inventory buyout and automatic 'sold' status...");
    const buyAllRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId, quantity: 5 }],
        shippingAddress: {
          fullName: "Mr. Buyer User",
          phone: "9123456780",
          address: "Kothrud, Pune",
          city: "Pune",
        },
      },
    });
    assert(buyAllRes.status === 201, "Full inventory purchase completed");

    const medAfterSold = await request(`/medicines/${medicineId}`);
    assert(medAfterSold.data?.data?.quantity === 0, `Medicine stock is now 0`);
    assert(medAfterSold.data?.data?.status === "sold", `Medicine status transitioned to 'sold'`);

    // 13. Attempt to buy from 'sold' medicine -> Rejected
    console.log("\n13. Testing purchase rejection on 'sold' medicine...");
    const soldBuyRes = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: {
        items: [{ medicineId, quantity: 1 }],
        shippingAddress: {
          fullName: "Mr. Buyer User",
          phone: "9123456780",
          address: "Kothrud, Pune",
          city: "Pune",
        },
      },
    });
    assert(
      soldBuyRes.status === 400 && (soldBuyRes.data?.message?.includes("unavailable") || soldBuyRes.data?.message?.includes("sold out")),
      `Purchase on sold-out medicine blocked with 400: "${soldBuyRes.data?.message}"`
    );

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`ORDER API TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runOrderTests();
