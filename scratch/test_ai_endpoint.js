async function testEndpoint() {
  console.log("=== Testing Backend /api/medicines/ai-suggest Endpoint ===");
  try {
    const res = await fetch("http://localhost:5000/api/medicines/ai-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "dolomide", quantity: 10 }),
    });

    console.log("Status Code:", res.status);
    const data = await res.json();
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (data.success && data.data?.price && data.data?.originalMrp && data.data?.quantity) {
      console.log("\n✅ AI Suggestion Endpoint SUCCESS!");
      console.log(`Medicine: ${data.data.brandName}`);
      console.log(`Generic Salt: ${data.data.genericName}`);
      console.log(`Market MRP: ₹${data.data.originalMrp}`);
      console.log(`Suggested Price: ₹${data.data.price}`);
      console.log(`Quantity: ${data.data.quantity}`);
    } else {
      console.error("❌ Unexpected response structure");
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testEndpoint();
