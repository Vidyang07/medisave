import { cepProofsData } from "../data/cepProofsData.js";
import Medicine from "../models/Medicine.js";
import Order from "../models/Order.js";

export const getCepProofs = async (req, res) => {
  try {
    // Dynamically calculate actual database impact to combine with field metrics
    let totalMedicines = 0;
    let totalApproved = 0;
    let totalDonations = 0;

    try {
      totalMedicines = await Medicine.countDocuments();
      totalApproved = await Medicine.countDocuments({ status: "approved" });
      totalDonations = await Medicine.countDocuments({ listingType: "free_donation" });
    } catch {
      // If DB offline/empty, fallback to seed metrics
    }

    const liveImpact = {
      ...cepProofsData.quantifiableImpact,
      livePlatformMedicines: totalMedicines,
      liveApprovedListings: totalApproved,
      liveFreeDonationsAvailable: totalDonations,
    };

    res.json({
      success: true,
      data: {
        ...cepProofsData,
        quantifiableImpact: liveImpact,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
