import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
      default: function () {
        return this.medicineName;
      },
    },
    genericName: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      required: [true, "Manufacturer / Company is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    strength: {
      type: String,
      trim: true,
      default: "",
    },
    dosageForm: {
      type: String,
      enum: ["Tablet", "Capsule", "Syrup", "Inhaler", "Injection", "Ointment", "Drops", "Other"],
      default: "Tablet",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    unit: {
      type: String,
      default: "1 pack",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Offered community price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalMrp: {
      type: Number,
      min: [0, "Original MRP cannot be negative"],
      default: function () {
        return this.price;
      },
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    batchNumber: {
      type: String,
      trim: true,
      default: "",
    },
    packageCondition: {
      type: String,
      trim: true,
      default: "Intact Sealed Blister Pack",
    },
    storageCondition: {
      type: String,
      trim: true,
      default: "Stored in cool, dry place (<25°C)",
    },
    isPrescriptionRequired: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
      default: "Kothrud",
    },
    pinCode: {
      type: String,
      trim: true,
      default: "411038",
    },
    handoverPoint: {
      type: String,
      trim: true,
      default: "City Pride Kothrud / Vanaz Metro Station",
    },
    handoverRadiusKm: {
      type: Number,
      default: 5,
      min: 1,
    },
    locationCoordinates: {
      lat: { type: Number, default: 18.5074 },
      lng: { type: Number, default: 73.8077 },
    },
    pricingRationale: {
      type: String,
      default: "",
      trim: true,
    },
    suggestedCommunityPrice: {
      type: Number,
      default: 0,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "sold"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted expiry string
medicineSchema.virtual("expiryText").get(function () {
  if (!this.expiryDate) return "";
  const d = new Date(this.expiryDate);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
});

// Scalability compound indexes
medicineSchema.index({ status: 1, locality: 1, createdAt: -1 });
medicineSchema.index({ status: 1, category: 1, createdAt: -1 });
medicineSchema.index({ seller: 1, createdAt: -1 });
medicineSchema.index({ medicineName: "text", brandName: "text", genericName: "text" });

// Ensure virtuals are included in toJSON / toObject
medicineSchema.set("toJSON", { virtuals: true });
medicineSchema.set("toObject", { virtuals: true });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;