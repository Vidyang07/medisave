import { ngoRequestsData } from "../data/ngoRequestsData.js";

// In-memory state initialized with seed data
let ngoRequests = [...ngoRequestsData];

export const getNgoRequests = (req, res) => {
  try {
    const { locality, urgency } = req.query;
    let filtered = [...ngoRequests];

    if (locality) {
      filtered = filtered.filter((r) =>
        r.locality.toLowerCase().includes(locality.toLowerCase())
      );
    }

    if (urgency) {
      filtered = filtered.filter(
        (r) => r.urgency.toLowerCase() === urgency.toLowerCase()
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fulfillNgoRequest = (req, res) => {
  try {
    const { id } = req.params;
    const { quantityDonated, donorNotes } = req.body;

    const requestIndex = ngoRequests.findIndex((r) => r.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "NGO Request not found" });
    }

    const currentReq = ngoRequests[requestIndex];
    const donationCount = Number(quantityDonated) || 10;
    const newFulfilled = Math.min(
      currentReq.requiredDoses,
      currentReq.fulfilledDoses + donationCount
    );

    ngoRequests[requestIndex] = {
      ...currentReq,
      fulfilledDoses: newFulfilled,
      status: newFulfilled >= currentReq.requiredDoses ? "fulfilled" : "active",
      lastDonation: {
        donatedAt: new Date().toISOString(),
        quantity: donationCount,
        notes: donorNotes || "Surplus community donation verified",
      },
    };

    res.json({
      success: true,
      message: `Successfully donated ${donationCount} units to ${currentReq.organizationName}!`,
      data: ngoRequests[requestIndex],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
