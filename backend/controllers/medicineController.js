import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";
import { getAiMedicineEstimation } from "../services/aiMedicineService.js";
import {
  calculateSuggestedPrice,
  validateSubmittedPrice,
} from "../services/pricingService.js";
import {
  findLocality,
  getProximityInfo,
} from "../config/localityConstants.js";

// @desc    Get all medicines with search, filters, sorting & pagination
// @route   GET /api/medicines
// @access  Public
export const getMedicines = async (req, res) => {
  try {
    const {
      search,
      category,
      dosageForm,
      maxPrice,
      rxFilter,
      sort,
      page = 1,
      limit = 12,
      status,
      buyerLocality,
      locality,
    } = req.query;

    const query = {};

    // 1. Status filter: Default to approved medicines for public marketplace
    if (status && ["pending", "approved", "rejected", "sold"].includes(status)) {
      query.status = status;
    } else {
      query.status = "approved";
    }

    // 2. Text Search (matches medicineName, brandName, company, genericName, locality, or category)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { medicineName: searchRegex },
        { brandName: searchRegex },
        { genericName: searchRegex },
        { company: searchRegex },
        { category: searchRegex },
        { locality: searchRegex },
        { handoverPoint: searchRegex },
      ];
    }

    // 3. Category Filter
    if (category && category !== "All Categories" && category !== "All") {
      query.category = category;
    }

    // 4. Dosage Form Filter
    if (dosageForm && dosageForm !== "All Forms" && dosageForm !== "All") {
      query.dosageForm = dosageForm;
    }

    // 5. Max Price Filter
    if (maxPrice && !isNaN(Number(maxPrice))) {
      query.price = { $lte: Number(maxPrice) };
    }

    // 6. Prescription Filter (otc = false, rx = true)
    if (rxFilter === "otc") {
      query.isPrescriptionRequired = false;
    } else if (rxFilter === "rx") {
      query.isPrescriptionRequired = true;
    }

    // 7. Locality Filter (if specified)
    if (locality && locality !== "All Localities" && locality !== "All") {
      query.locality = new RegExp(locality.trim(), "i");
    }

    // 8. Sorting & Proximity
    const isNearbySort = sort === "nearby";
    let sortOptions = { createdAt: -1 };
    if (sort === "price-low") {
      sortOptions = { price: 1 };
    } else if (sort === "price-high") {
      sortOptions = { price: -1 };
    } else if (sort === "expiry-nearest") {
      sortOptions = { expiryDate: 1 };
    } else if (sort === "recommended" || sort === "newest") {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Medicine.countDocuments(query);
    const activeBuyerLoc = buyerLocality || "Kothrud";

    if (isNearbySort) {
      // For nearby sorting: fetch candidates and sort deterministically by Haversine distance
      const allCandidates = await Medicine.find(query)
        .populate("seller", "name email phone address avatar isVerified createdAt");

      const enriched = allCandidates.map((med) => {
        const medObj = med.toObject ? med.toObject({ virtuals: true }) : med;
        const prox = getProximityInfo(
          activeBuyerLoc,
          medObj.locationCoordinates || medObj.locality
        );
        return {
          ...medObj,
          proximity: prox,
        };
      });

      enriched.sort((a, b) => {
        const distA = a.proximity?.distanceKm ?? 999;
        const distB = b.proximity?.distanceKm ?? 999;
        if (distA !== distB) return distA - distB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const paginated = enriched.slice(skip, skip + limitNum);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
        buyerLocality: activeBuyerLoc,
        data: paginated,
      });
    }

    const medicines = await Medicine.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate("seller", "name email phone address avatar isVerified createdAt");

    const mapped = medicines.map((med) => {
      const medObj = med.toObject ? med.toObject({ virtuals: true }) : med;
      const prox = getProximityInfo(
        activeBuyerLoc,
        medObj.locationCoordinates || medObj.locality
      );
      return {
        ...medObj,
        proximity: prox,
      };
    });

    return res.status(200).json({
      success: true,
      count: mapped.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      buyerLocality: activeBuyerLoc,
      data: mapped,
    });
  } catch (error) {
    console.error("Get Medicines Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching medicines",
      error: error.message,
    });
  }
};

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const medicine = await Medicine.findById(id).populate(
      "seller",
      "name email phone address avatar isVerified createdAt"
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Get Medicine By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching medicine details",
      error: error.message,
    });
  }
};

// @desc    Get listings created by the logged-in user
// @route   GET /api/medicines/my-listings
// @access  Private
export const getMyListings = async (req, res) => {
  try {
    const medicines = await Medicine.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .populate("seller", "name email phone address avatar isVerified");

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    console.error("Get My Listings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user listings",
      error: error.message,
    });
  }
};

// @desc    Calculate deterministic MEDISAVE community price proposal
// @route   POST /api/medicines/calculate-pricing
// @access  Public / Private
export const calculatePricingProposal = async (req, res) => {
  try {
    const { originalMrp, packageCondition, expiryDate } = req.body;
    const calc = calculateSuggestedPrice({
      originalMrp,
      packageCondition,
      expiryDate,
    });
    return res.status(200).json({
      success: true,
      data: calc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error calculating pricing proposal",
      error: error.message,
    });
  }
};

// @desc    Create / list a new medicine
// @route   POST /api/medicines
// @access  Private
export const createMedicine = async (req, res) => {
  try {
    const {
      medicineName,
      brandName,
      genericName,
      company,
      category,
      strength,
      dosageForm,
      quantity,
      unit,
      price,
      originalMrp,
      expiryDate,
      batchNumber,
      packageCondition,
      storageCondition,
      isPrescriptionRequired,
      image,
      description,
      locality,
      pinCode,
      handoverPoint,
      handoverRadiusKm,
      pricingRationale,
      suggestedCommunityPrice,
    } = req.body;

    const finalName = medicineName || brandName;

    // 1. Required field validation
    if (!finalName || !company || !category || quantity === undefined || price === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields: name, company, category, quantity, price, and expiry date",
      });
    }

    // 2. Numeric validation
    const numQty = Number(quantity);
    const numPrice = Number(price);
    const numMrp =
      originalMrp !== undefined && originalMrp !== "" && Number(originalMrp) > 0
        ? Number(originalMrp)
        : Math.round(numPrice * 1.5);

    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid number of at least 1",
      });
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    // 3. Expiry date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);

    if (isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid expiry date",
      });
    }

    if (expiry <= today) {
      return res.status(400).json({
        success: false,
        message: "Medicine must not be expired. Only unexpired medicines can be listed.",
      });
    }

    // 4. Backend Pricing Policy Validation
    const priceValidation = validateSubmittedPrice({
      price: numPrice,
      originalMrp: numMrp,
      expiryDate: expiry,
    });

    if (!priceValidation.valid) {
      return res.status(400).json({
        success: false,
        message: priceValidation.error,
        maxAllowedPrice: priceValidation.maxAllowedPrice,
      });
    }

    // 5. Deterministic Suggested Price and Locality Resolution
    const suggestedCalc = calculateSuggestedPrice({
      originalMrp: numMrp,
      packageCondition: packageCondition || "Intact Sealed Blister Pack",
      expiryDate: expiry,
    });

    const locData = findLocality(locality || "Katraj");
    const resolvedLocality = locData?.name || locality?.trim() || "Katraj";
    const resolvedPin = pinCode?.trim() || locData?.pinCode || "411046";
    const resolvedCoords = {
      lat: locData ? locData.lat : 18.4529,
      lng: locData ? locData.lng : 73.8652,
    };
    const resolvedHandoverPoint = handoverPoint?.trim() || locData?.defaultHandover || "Community Landmark / Main Gate";
    const resolvedRadius = Number(handoverRadiusKm) || 5;

    // 6. Create medicine with seller bound to authenticated user
    const medicine = await Medicine.create({
      medicineName: finalName.trim(),
      brandName: (brandName || finalName).trim(),
      genericName: genericName ? genericName.trim() : "",
      company: company.trim(),
      category: category.trim(),
      strength: strength ? strength.trim() : "",
      dosageForm: dosageForm || "Tablet",
      quantity: numQty,
      unit: unit ? unit.trim() : "1 pack",
      price: numPrice,
      originalMrp: numMrp,
      expiryDate: expiry,
      batchNumber: batchNumber ? batchNumber.trim() : "",
      packageCondition: packageCondition ? packageCondition.trim() : "Intact Sealed Blister Pack",
      storageCondition: storageCondition ? storageCondition.trim() : "Stored in cool, dry place (<25°C)",
      isPrescriptionRequired: Boolean(isPrescriptionRequired),
      image: image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
      description: description ? description.trim() : "",
      seller: req.user._id,
      status: "pending",
      locality: resolvedLocality,
      pinCode: resolvedPin,
      handoverPoint: resolvedHandoverPoint,
      handoverRadiusKm: resolvedRadius,
      locationCoordinates: resolvedCoords,
      pricingRationale: pricingRationale || suggestedCalc.rationale,
      suggestedCommunityPrice: suggestedCommunityPrice !== undefined ? Number(suggestedCommunityPrice) : suggestedCalc.suggestedPrice,
    });

    const populatedMedicine = await Medicine.findById(medicine._id).populate(
      "seller",
      "name email phone address avatar isVerified createdAt"
    );

    return res.status(201).json({
      success: true,
      message: "Medicine listed successfully and sent for community moderation",
      data: populatedMedicine,
    });
  } catch (error) {
    console.error("Create Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating medicine listing",
      error: error.message,
    });
  }
};

// @desc    Update an existing medicine listing
// @route   PUT /api/medicines/:id
// @access  Private (Owner or Admin)
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    // Ownership check: seller must match req.user._id (or admin)
    const isOwner = medicine.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only modify your own listings",
      });
    }

    // Validate expiry date if updated
    let targetExpiry = medicine.expiryDate;
    if (req.body.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(req.body.expiryDate);

      if (isNaN(expiry.getTime()) || expiry <= today) {
        return res.status(400).json({
          success: false,
          message: "Updated expiry date must be a valid future date",
        });
      }
      targetExpiry = expiry;
    }

    const targetPrice = req.body.price !== undefined ? Number(req.body.price) : medicine.price;
    const targetMrp = req.body.originalMrp !== undefined ? Number(req.body.originalMrp) : medicine.originalMrp;

    // Validate pricing rules if price or MRP is changed
    if (req.body.price !== undefined || req.body.originalMrp !== undefined || req.body.expiryDate !== undefined) {
      const priceValidation = validateSubmittedPrice({
        price: targetPrice,
        originalMrp: targetMrp,
        expiryDate: targetExpiry,
      });

      if (!priceValidation.valid) {
        return res.status(400).json({
          success: false,
          message: priceValidation.error,
          maxAllowedPrice: priceValidation.maxAllowedPrice,
        });
      }
    }

    // Update allowed fields
    const updatableFields = [
      "medicineName",
      "brandName",
      "genericName",
      "company",
      "category",
      "strength",
      "dosageForm",
      "quantity",
      "unit",
      "price",
      "originalMrp",
      "expiryDate",
      "batchNumber",
      "packageCondition",
      "storageCondition",
      "isPrescriptionRequired",
      "image",
      "description",
      "status",
      "locality",
      "pinCode",
      "handoverPoint",
      "handoverRadiusKm",
      "pricingRationale",
      "suggestedCommunityPrice",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        medicine[field] = req.body[field];
      }
    });

    // If locality was updated, update coordinates
    if (req.body.locality) {
      const locData = findLocality(req.body.locality);
      if (locData) {
        medicine.locationCoordinates = { lat: locData.lat, lng: locData.lng };
        if (!req.body.pinCode) {
          medicine.pinCode = locData.pinCode;
        }
      }
    }

    const updatedMedicine = await medicine.save();
    const populated = await Medicine.findById(updatedMedicine._id).populate(
      "seller",
      "name email phone address avatar isVerified createdAt"
    );

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating medicine listing",
      error: error.message,
    });
  }
};

// @desc    Delete a medicine listing
// @route   DELETE /api/medicines/:id
// @access  Private (Owner or Admin)
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    // Ownership check
    const isOwner = medicine.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only delete your own listings",
      });
    }

    await Medicine.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Medicine listing removed successfully",
    });
  } catch (error) {
    console.error("Delete Medicine Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting medicine listing",
      error: error.message,
    });
  }
};

// @desc    Analyze medicine title with OpenRouter AI for auto-fill & market price suggestion
// @route   POST /api/medicines/ai-suggest
// @access  Public / Private
export const getAiMedicineSuggestion = async (req, res) => {
  try {
    const { title, medicineName, brandName, quantity, dosageForm, category } = req.body;
    const queryTitle = title || medicineName || brandName;

    if (!queryTitle || !queryTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a medicine title or name (e.g. 'Dolomide' or 'Dolo 650')",
      });
    }

    const estimation = await getAiMedicineEstimation({
      title: queryTitle.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      contextData: { dosageForm, category },
    });

    return res.status(200).json({
      success: true,
      message: "AI medicine analysis generated successfully",
      source: estimation.source,
      model: estimation.model,
      data: estimation.data,
    });
  } catch (error) {
    console.error("AI Medicine Suggestion Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI medicine estimation",
      error: error.message,
    });
  }
};