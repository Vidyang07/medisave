import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer reference is required"],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, "Patient name on prescription is required"],
      trim: true,
    },
    doctorName: {
      type: String,
      default: "",
      trim: true,
    },
    doctorRegistrationNumber: {
      type: String,
      default: "",
      trim: true,
    },
    medicines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
    ],
    prescribedSalts: {
      type: String,
      default: "",
      trim: true,
    },
    documentPath: {
      type: String,
      required: [true, "Document file path is required"],
      trim: true,
    },
    documentOriginalName: {
      type: String,
      required: [true, "Original document file name is required"],
      trim: true,
    },
    documentMimeType: {
      type: String,
      required: [true, "Document MIME type is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [1, "File size must be greater than 0 bytes"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a buyer's prescriptions by verification status
prescriptionSchema.index({ buyer: 1, status: 1 });

// Ensure virtuals are included in toJSON / toObject
prescriptionSchema.set("toJSON", { virtuals: true });
prescriptionSchema.set("toObject", { virtuals: true });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
