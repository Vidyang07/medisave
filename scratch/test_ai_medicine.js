import { getAiMedicineEstimation } from "../backend/services/aiMedicineService.js";

async function runTest() {
  console.log("=== Testing AI Medicine Estimation Engine ===");

  console.log("\n1. Testing 'dolomide':");
  const res1 = await getAiMedicineEstimation({ title: "dolomide" });
  console.log("Source:", res1.source, "| Model:", res1.model);
  console.log("Brand:", res1.data.brandName);
  console.log("Generic Salt:", res1.data.genericName);
  console.log("Company:", res1.data.company);
  console.log("Category:", res1.data.category);
  console.log("Dosage Form & Strength:", res1.data.dosageForm, res1.data.strength);
  console.log("Standard Quantity:", res1.data.quantity, "| Unit:", res1.data.unit);
  console.log("Market MRP: ₹", res1.data.originalMrp);
  console.log("Suggested Community Price: ₹", res1.data.price);
  console.log("Discount:", res1.data.discountPercentage, "%");
  console.log("Pricing Explanation:", res1.data.pricingExplanation);

  console.log("\n2. Testing 'dolomide' with custom quantity = 20:");
  const res2 = await getAiMedicineEstimation({ title: "dolomide", quantity: 20 });
  console.log("Quantity:", res2.data.quantity, "| Unit:", res2.data.unit);
  console.log("Market MRP: ₹", res2.data.originalMrp);
  console.log("Suggested Community Price: ₹", res2.data.price);

  console.log("\n3. Testing 'Augmentin 625':");
  const res3 = await getAiMedicineEstimation({ title: "Augmentin 625" });
  console.log("Brand:", res3.data.brandName);
  console.log("Generic Salt:", res3.data.genericName);
  console.log("Market MRP: ₹", res3.data.originalMrp, "| Community Price: ₹", res3.data.price);
  console.log("Prescription Required:", res3.data.isPrescriptionRequired);

  console.log("\n4. Testing generic unknown 'Azithral 250mg syrup':");
  const res4 = await getAiMedicineEstimation({ title: "Azithral 250mg syrup" });
  console.log("Brand:", res4.data.brandName);
  console.log("Dosage Form:", res4.data.dosageForm);
  console.log("Category:", res4.data.category);
  console.log("Market MRP: ₹", res4.data.originalMrp, "| Community Price: ₹", res4.data.price);
  console.log("Quantity:", res4.data.quantity, "| Unit:", res4.data.unit);

  console.log("\n=== Test Completed Successfully ===");
}

runTest().catch(console.error);
