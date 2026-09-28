import mongoose from "mongoose";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import { findLocality } from "./localityConstants.js";
import { calculateSuggestedPrice } from "../services/pricingService.js";

const SEED_MEDICINES = [
  {
    medicineName: "Paracetamol Tablets IP",
    brandName: "Crocin 500 Advance",
    company: "GlaxoSmithKline (GSK)",
    genericName: "Paracetamol (500mg)",
    strength: "500 mg",
    dosageForm: "Tablet",
    category: "Pain & Fever",
    quantity: 15,
    unit: "Tablets (1.5 strips)",
    price: 25,
    originalMrp: 48,
    expiryDate: new Date("2027-04-30"),
    batchNumber: "GSK-P2409",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: false,
    status: "approved",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    description: "Unused, unexpired Paracetamol 500mg tablets stored in dry conditions below 25°C. Sealed blister packaging with clearly legible batch number and expiry date.",
    storageCondition: "Store in a cool, dry place away from sunlight (<25°C)",
    locality: "Katraj",
    pinCode: "411046",
    handoverPoint: "Bharati Vidyapeeth Main Gate",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.4529, longitude: 73.8652 },
    suggestedCommunityPrice: 28,
    pricingRationale: "Based on MRP ₹48, intact sealed packaging and 13+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Dolo 650 Tablets",
    brandName: "Dolo 650",
    company: "Micro Labs Ltd.",
    genericName: "Paracetamol IP (650mg)",
    strength: "650 mg",
    dosageForm: "Tablet",
    category: "Pain & Fever",
    quantity: 20,
    unit: "Tablets (2 strips)",
    price: 38,
    originalMrp: 72,
    expiryDate: new Date("2027-08-31"),
    batchNumber: "ML-650X82",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: false,
    status: "approved",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
    description: "Genuine Dolo 650mg strips from a doctor-prescribed recovery course. Surplus sealed tablets kept in original foil packaging.",
    storageCondition: "Protect from moisture and direct light",
    locality: "Kothrud",
    pinCode: "411038",
    handoverPoint: "Vanaz Metro Station Entrance",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5074, longitude: 73.8077 },
    suggestedCommunityPrice: 43,
    pricingRationale: "Based on MRP ₹72, intact sealed packaging and 17+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Azithromycin Tablets IP 500mg",
    brandName: "Azee 500",
    company: "Cipla Ltd.",
    genericName: "Azithromycin Dihydrate (500mg)",
    strength: "500 mg",
    dosageForm: "Tablet",
    category: "Antibiotics",
    quantity: 6,
    unit: "Tablets (2 packs of 3)",
    price: 75,
    originalMrp: 135,
    expiryDate: new Date("2027-02-28"),
    batchNumber: "CP-AZ7712",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: true,
    status: "approved",
    image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80",
    description: "Unopened Azee 500mg antibiotic tablets. Fully sealed foil packs with clear manufacturer batch stamping and QR code.",
    storageCondition: "Store below 30°C in a dry location",
    locality: "Hinjewadi",
    pinCode: "411057",
    handoverPoint: "Phase 1 Infosys Circle",
    handoverRadiusKm: 10,
    locationCoordinates: { latitude: 18.5913, longitude: 73.7389 },
    suggestedCommunityPrice: 81,
    pricingRationale: "Based on MRP ₹135, intact sealed blister and 11+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Vitamin C Chewable Tablets",
    brandName: "Limcee 500mg Orange",
    company: "Abbott Healthcare",
    genericName: "Ascorbic Acid IP (500mg)",
    strength: "500 mg",
    dosageForm: "Tablet",
    category: "Vitamins & Supplements",
    quantity: 30,
    unit: "Tablets (2 strips)",
    price: 32,
    originalMrp: 55,
    expiryDate: new Date("2027-10-31"),
    batchNumber: "ABT-LC901",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: false,
    status: "approved",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80",
    description: "Sealed strips of Limcee chewable vitamin C supplements. Purchased in bulk during recovery, surplus unexpired stock.",
    storageCondition: "Store below 25°C in cool environment",
    locality: "Baner",
    pinCode: "411045",
    handoverPoint: "High Street Starbucks Junction",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5590, longitude: 73.7868 },
    suggestedCommunityPrice: 33,
    pricingRationale: "Based on MRP ₹55, intact sealed packaging and 19+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Telmisartan Tablets IP 40mg",
    brandName: "Telma 40",
    company: "Glenmark Pharmaceuticals",
    genericName: "Telmisartan (40mg)",
    strength: "40 mg",
    dosageForm: "Tablet",
    category: "Cardiovascular & BP",
    quantity: 28,
    unit: "Tablets (2 full strips)",
    price: 110,
    originalMrp: 210,
    expiryDate: new Date("2027-06-30"),
    batchNumber: "GM-TL409",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: true,
    status: "approved",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    description: "Prescription blood pressure medication. Patient dosage was altered by cardiologist, leaving 2 sealed unexpired strips.",
    storageCondition: "Store at room temperature (15-30°C)",
    locality: "Viman Nagar",
    pinCode: "411014",
    handoverPoint: "Phoenix Marketcity Gate 2",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5679, longitude: 73.9143 },
    suggestedCommunityPrice: 126,
    pricingRationale: "Based on MRP ₹210, intact sealed blister and 15+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Metformin Hydrochloride Prolonged-Release",
    brandName: "Glycomet-GP 1",
    company: "USV Private Limited",
    genericName: "Metformin (500mg) + Glimepiride (1mg)",
    strength: "500mg / 1mg",
    dosageForm: "Tablet",
    category: "Diabetes Care",
    quantity: 20,
    unit: "Tablets (2 strips)",
    price: 85,
    originalMrp: 165,
    expiryDate: new Date("2027-05-31"),
    batchNumber: "USV-GL044",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: true,
    status: "approved",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
    description: "Diabetes management therapy. Genuine strips stored in a temperature-controlled household medicine cabinet.",
    storageCondition: "Keep away from excessive heat and humidity",
    locality: "Swargate",
    pinCode: "411042",
    handoverPoint: "Swargate ST Bus Stand Gate",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5018, longitude: 73.8636 },
    suggestedCommunityPrice: 99,
    pricingRationale: "Based on MRP ₹165, intact sealed packaging and 14+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Montelukast & Levocetirizine Tablets",
    brandName: "Montair LC",
    company: "Cipla Ltd.",
    genericName: "Montelukast (10mg) + Levocetirizine (5mg)",
    strength: "10mg / 5mg",
    dosageForm: "Tablet",
    category: "Respiratory & Allergy",
    quantity: 10,
    unit: "Tablets (1 strip)",
    price: 95,
    originalMrp: 180,
    expiryDate: new Date("2027-03-31"),
    batchNumber: "CP-ML310",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: true,
    status: "approved",
    image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80",
    description: "Allergy and asthma relief tablets. Surplus from seasonal prescription in pristine sealed packaging.",
    storageCondition: "Protect from light and moisture",
    locality: "Hadapsar",
    pinCode: "411028",
    handoverPoint: "Magarpatta South Gate",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5089, longitude: 73.9259 },
    suggestedCommunityPrice: 108,
    pricingRationale: "Based on MRP ₹180, intact sealed packaging and 12+ months shelf life (~60% community rate).",
  },
  {
    medicineName: "Pantoprazole Gastro-Resistant Tablets IP",
    brandName: "Pan 40",
    company: "Alkem Laboratories",
    genericName: "Pantoprazole Sodium (40mg)",
    strength: "40 mg",
    dosageForm: "Tablet",
    category: "Gastrointestinal",
    quantity: 15,
    unit: "Tablets (1.5 strips)",
    price: 65,
    originalMrp: 130,
    expiryDate: new Date("2027-09-30"),
    batchNumber: "ALK-PN882",
    packageCondition: "Intact Sealed Blister Pack",
    isPrescriptionRequired: false,
    status: "approved",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    description: "Gastro-resistant acid reducer tablets. Intact sealed blister strips with valid manufacturer hologram.",
    storageCondition: "Store in a dry place (<25°C)",
    locality: "Wakad",
    pinCode: "411057",
    handoverPoint: "Dharmaraj Chowk",
    handoverRadiusKm: 5,
    locationCoordinates: { latitude: 18.5987, longitude: 73.7663 },
    suggestedCommunityPrice: 78,
    pricingRationale: "Based on MRP ₹130, intact sealed packaging and 18+ months shelf life (~60% community rate).",
  },
];

export const seedInitialMedicines = async () => {
  try {
    // Check if medicines exist
    const medicineCount = await Medicine.countDocuments();
    
    // Find or create default community donor user
    let donor = await User.findOne({ email: "community.donor@medisave.org" });
    if (!donor) {
      donor = await User.create({
        name: "Dr. Ananya Sharma (Community Health)",
        email: "community.donor@medisave.org",
        password: "MedisaveSeedPassword2026!",
        phone: "+91 98230 45678",
        address: "Kothrud, Pune, Maharashtra",
        role: "user",
        isVerified: true,
      });
    }

    if (medicineCount === 0) {
      console.log("Seeding verified pharmaceutical catalog with Pune localities into MongoDB...");
      const medicinesToInsert = SEED_MEDICINES.map((med) => ({
        ...med,
        seller: donor._id,
      }));
      await Medicine.insertMany(medicinesToInsert);
      console.log(`Successfully seeded ${medicinesToInsert.length} verified medicines!`);
      return;
    }

    // Backfill any existing medicines that don't have locality or coordinates
    const unlocalized = await Medicine.find({
      $or: [
        { locality: { $exists: false } },
        { locality: "" },
        { locationCoordinates: { $exists: false } },
        { "locationCoordinates.latitude": { $exists: false } },
      ],
    });

    if (unlocalized.length > 0) {
      console.log(`Backfilling Pune locality & handover metadata for ${unlocalized.length} existing medicines...`);
      const defaultLocs = ["Katraj", "Kothrud", "Hinjewadi", "Baner", "Viman Nagar", "Hadapsar", "Swargate", "Wakad"];
      
      for (let i = 0; i < unlocalized.length; i++) {
        const med = unlocalized[i];
        const chosenLocName = defaultLocs[i % defaultLocs.length];
        const locInfo = findLocality(chosenLocName);
        med.locality = locInfo.name;
        med.pinCode = locInfo.pinCode;
        med.handoverPoint = locInfo.defaultHandoverPoint;
        med.handoverRadiusKm = 5;
        med.locationCoordinates = locInfo.coordinates;
        if (!med.suggestedCommunityPrice) {
          const calc = calculateSuggestedPrice({
            originalMrp: med.originalMrp || med.price,
            packageCondition: med.packageCondition,
            expiryDate: med.expiryDate,
          });
          med.suggestedCommunityPrice = calc.suggestedPrice;
          med.pricingRationale = calc.rationale;
        }
        await med.save();
      }
      console.log("Completed backfilling locality & handover data.");
    }
  } catch (error) {
    console.warn("Seeding initial medicines notice:", error.message);
  }
};
