import mongoose from "../backend/node_modules/mongoose/index.js";
import Prescription from "../backend/models/Prescription.js";

async function runPrescriptionModelTest() {
  console.log("=== TESTING PRESCRIPTION MONGOOSE MODEL ===");
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
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisave");
    }

    const dummyBuyerId = new mongoose.Types.ObjectId();
    const dummyMedicineId = new mongoose.Types.ObjectId();

    // 1. Validation error on empty document
    const emptyDoc = new Prescription({});
    const validationErr = emptyDoc.validateSync();
    assert(validationErr && validationErr.errors.buyer, "Fails validation when buyer is missing");
    assert(validationErr && validationErr.errors.patientName, "Fails validation when patientName is missing");
    assert(validationErr && validationErr.errors.documentPath, "Fails validation when documentPath is missing");
    assert(validationErr && validationErr.errors.documentOriginalName, "Fails validation when documentOriginalName is missing");
    assert(validationErr && validationErr.errors.documentMimeType, "Fails validation when documentMimeType is missing");
    assert(validationErr && validationErr.errors.fileSize, "Fails validation when fileSize is missing");

    // 2. Default status is 'pending'
    const validDoc = new Prescription({
      buyer: dummyBuyerId,
      patientName: "  Smt. Shaila Patil  ",
      doctorName: "  Dr. Kulkarni  ",
      doctorRegistrationNumber: "  MCI-48921  ",
      medicines: [dummyMedicineId],
      prescribedSalts: "  Azithromycin 500mg  ",
      documentPath: "uploads/prescriptions/rx-sample-01.jpg",
      documentOriginalName: "prescription_scan.jpg",
      documentMimeType: "image/jpeg",
      fileSize: 1048576,
    });

    assert(validDoc.status === "pending", "Default status is correctly set to 'pending'");
    assert(validDoc.patientName === "Smt. Shaila Patil", "patientName is trimmed");
    assert(validDoc.doctorName === "Dr. Kulkarni", "doctorName is trimmed");
    assert(validDoc.doctorRegistrationNumber === "MCI-48921", "doctorRegistrationNumber is trimmed");
    assert(validDoc.prescribedSalts === "Azithromycin 500mg", "prescribedSalts is trimmed");

    // 3. Status enum validation
    validDoc.status = "invalid_status";
    const enumErr = validDoc.validateSync();
    assert(enumErr && enumErr.errors.status, "Rejects invalid status not in enum (pending, approved, rejected)");

    // 4. Save and fetch from DB
    validDoc.status = "pending";
    const saved = await validDoc.save();
    assert(saved._id && saved.createdAt && saved.updatedAt, "Successfully saved valid Prescription to MongoDB with timestamps");

    // 5. Cleanup test record
    await Prescription.findByIdAndDelete(saved._id);
    console.log("[INFO] Cleaned up temporary test record");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Prescription Model Test Error:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`PRESCRIPTION MODEL TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPrescriptionModelTest();
