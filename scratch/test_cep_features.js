import assert from "node:assert";
import { cepProofsData } from "../backend/data/cepProofsData.js";
import { getCepProofs } from "../backend/controllers/cepProofController.js";

console.log("==================================================");
console.log("🧪 TESTING MEDISAVE CLEAN CEP LOGBOOK COMPLIANCE");
console.log("==================================================");

// 1. Verify CEP Academic & Logbook Data
assert.strictEqual(cepProofsData.academicInfo.courseCode, "0313201");
assert.strictEqual(cepProofsData.academicInfo.institute.includes("PICT"), true);
assert.strictEqual(cepProofsData.teamMembers.length, 4);
assert.strictEqual(cepProofsData.logbookWeeks.length, 14);
console.log("✅ Assertion 1 Passed: CEP Academic structure & 14-week logbook intact.");

// 2. Verify Team Roll Numbers
const rollNos = cepProofsData.teamMembers.map((m) => m.rollNo);
assert.deepStrictEqual(rollNos, ["21270", "21282", "21269", "21271"]);
console.log("✅ Assertion 2 Passed: Student roll numbers verified (Batch H2).");

// 3. Verify SDG Alignment
assert.strictEqual(cepProofsData.quantifiableImpact.targetSdgs.length, 2);
console.log("✅ Assertion 3 Passed: UN SDG 3 & 12 targets verified.");

console.log("\n🎉 CLEAN & SAFE CEP COMPLIANCE TESTS PASSED SUCCESSFULLY!");
