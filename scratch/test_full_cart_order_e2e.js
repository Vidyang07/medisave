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

async function runFullE2ETest() {
  console.log("=== RUNNING FULL MEDISAVE CART + ORDER E2E SUITE ===\n");
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

  // Step 1: Create seller & buyer accounts
  const sellerRes = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Dr. Rajesh Kulkarni",
      email: `rajesh_${ts}@hospital.org`,
      password: "Password123!",
      phone: "9822012345",
      address: "Deccan Gymkhana, Pune",
    },
  });
  const sellerToken = sellerRes.data?.data?.token;

  const buyerRes = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Smt. Sunita Deshmukh",
      email: `sunita_${ts}@gmail.com`,
      password: "Password123!",
      phone: "9823054321",
      address: "Flat 302, Sahakar Nagar, Pune",
    },
  });
  const buyerToken = buyerRes.data?.data?.token;

  assert(sellerToken && buyerToken, "Step 1: Successfully registered Seller & Buyer");

  // Step 2: Seller lists two medications
  const med1Res = await request("/medicines", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: {
      medicineName: "Metformin 500mg SR",
      brandName: "Glycomet SR 500",
      company: "USV Ltd",
      category: "Diabetes",
      strength: "500 mg",
      quantity: 10,
      price: 45,
      originalMrp: 90,
      expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  const med1 = med1Res.data?.data;

  const med2Res = await request("/medicines", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: {
      medicineName: "Telmisartan 40mg",
      brandName: "Telma 40",
      company: "Glenmark Pharmaceuticals",
      category: "Cardiac & BP",
      strength: "40 mg",
      quantity: 8,
      price: 110,
      originalMrp: 220,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  const med2 = med2Res.data?.data;

  // Approve medicines in MongoDB for checkout test
  const { default: mongoose } = await import("../backend/node_modules/mongoose/index.js");
  const { default: Medicine } = await import("../backend/models/Medicine.js");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
  }
  await Medicine.updateMany({ _id: { $in: [med1._id, med2._id] } }, { status: "approved" });

  assert(med1 && med2, "Step 2: Successfully listed 2 surplus medications");

  // Step 3: Buyer places multi-item order with fake client prices
  const orderRes = await request("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: {
      items: [
        { medicineId: med1._id, quantity: 4, price: 1 }, // 4 * 45 = 180
        { medicineId: med2._id, quantity: 2, price: 5 }, // 2 * 110 = 220
      ],
      shippingAddress: {
        fullName: "Smt. Sunita Deshmukh",
        phone: "9823054321",
        address: "Flat 302, Sahakar Nagar",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411009",
      },
    },
  });

  const order = orderRes.data?.data;
  assert(orderRes.status === 201, "Step 3: Multi-item order placed successfully");
  assert(order.subtotal === 400, `Step 3: Server subtotal is ₹400 (4*45 + 2*110 = 180 + 220)`);
  assert(order.shippingFee === 0, `Step 3: Free shipping on subtotal >= 200 (Fee: ₹${order.shippingFee})`);
  assert(order.totalAmount === 400, `Step 3: Total amount is ₹400`);

  // Step 4: Verify stock decremented
  const checkMed1 = await request(`/medicines/${med1._id}`);
  const checkMed2 = await request(`/medicines/${med2._id}`);
  assert(checkMed1.data?.data?.quantity === 6, `Step 4: Med1 stock reduced from 10 to 6`);
  assert(checkMed2.data?.data?.quantity === 6, `Step 4: Med2 stock reduced from 8 to 6`);

  // Step 5: Buyer retrieves their orders
  const myOrders = await request("/orders/my-orders", {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(myOrders.data?.count === 1, `Step 5: Buyer has exactly 1 order in dashboard`);
  assert(myOrders.data?.data[0]?.items?.length === 2, `Step 5: Order contains both items`);

  // Step 6: Buyer cancels the order
  const cancelRes = await request(`/orders/${order._id}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: { reason: "Prescription dosage modified by doctor" },
  });
  assert(cancelRes.data?.data?.status === "cancelled", `Step 6: Order status changed to 'cancelled'`);

  // Step 7: Verify stock restored
  const restoredMed1 = await request(`/medicines/${med1._id}`);
  const restoredMed2 = await request(`/medicines/${med2._id}`);
  assert(restoredMed1.data?.data?.quantity === 10, `Step 7: Med1 stock restored to 10`);
  assert(restoredMed2.data?.data?.quantity === 8, `Step 7: Med2 stock restored to 8`);

  console.log(`\n========================================`);
  console.log(`FULL E2E TEST: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFullE2ETest();
