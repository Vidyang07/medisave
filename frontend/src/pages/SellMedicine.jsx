import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { CATEGORIES } from "../data/mockData";
import { useToast } from "../context/useToast";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { Button } from "../components/common/Button";
import {
  ShieldCheckIcon,
  AlertCircleIcon,
  UploadIcon,
  CheckIcon,
  SparklesIcon,
} from "../components/common/Icons";
import { PUNE_LOCALITIES, findLocality } from "../utils/localityConstants";
import { calculateSuggestedPrice, PRICING_CONSTANTS } from "../utils/pricingPolicy";

export default function SellMedicine() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    brandName: "",
    genericName: "",
    company: "",
    category: "",
    dosageForm: "Tablet",
    strength: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "",
    unit: "Tablets (1 strip)",
    originalMrp: "",
    price: "",
    packageCondition: "Intact Sealed Blister Pack",
    storageCondition: "Stored in cool, dry place (<25°C)",
    isPrescriptionRequired: false,
    storageConfirmed: false,
    description: "",
    locality: "Kothrud",
    pinCode: "411038",
    handoverPoint: "City Pride Kothrud / Vanaz Metro Station",
    handoverRadiusKm: 5,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submissionReference, setSubmissionReference] = useState("");
  const [serverError, setServerError] = useState("");

  // AI Assistant States
  const [aiQuery, setAiQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Deterministic Pricing Policy Calculation
  const pricingEval = useMemo(() => {
    return calculateSuggestedPrice({
      originalMrp: formData.originalMrp,
      expiryDate: formData.expiryDate,
      packageCondition: formData.packageCondition,
    });
  }, [formData.originalMrp, formData.expiryDate, formData.packageCondition]);

  // Expiry evaluation
  const expiryCheck = useMemo(() => {
    if (!formData.expiryDate) return { status: "empty", message: "" };
    const expDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        status: "expired",
        message: "Expired medicines cannot be listed under any circumstances.",
      };
    }
    if (diffDays < PRICING_CONSTANTS.MIN_EXPIRY_DAYS) {
      return {
        status: "short",
        message: `Medicine expires in ${diffDays} days. MEDISAVE requires at least ${PRICING_CONSTANTS.MIN_EXPIRY_DAYS} days remaining shelf life for community safety.`,
      };
    }
    return {
      status: "valid",
      message: `Shelf life: ${diffDays} days remaining (${Math.round(diffDays / 30.44)} months).`,
    };
  }, [formData.expiryDate]);

  const handleAiEstimate = async (medicineTitle, customQuantity = null) => {
    const query = (medicineTitle || aiQuery || formData.brandName || "").trim();
    if (!query) {
      showToast("Please enter a medicine name (e.g. Dolomide or Dolo 650)", "info");
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await api.post("/medicines/ai-suggest", {
        title: query,
        quantity: customQuantity !== null ? customQuantity : formData.quantity || undefined,
        dosageForm: formData.dosageForm,
        category: formData.category,
      });

      if (res.data?.success && res.data.data) {
        const est = res.data.data;
        setAiSuggestion(est);
        setAiQuery(est.brandName || query);

        setFormData((prev) => {
          const updated = {
            ...prev,
            brandName: est.brandName || prev.brandName || query,
            genericName: est.genericName || prev.genericName,
            company: est.company || prev.company,
            category: est.category || prev.category,
            dosageForm: est.dosageForm || prev.dosageForm,
            strength: est.strength || prev.strength,
            quantity: est.quantity !== undefined ? est.quantity : prev.quantity,
            unit: est.unit || prev.unit,
            originalMrp: prev.originalMrp || est.originalMrp || "",
            isPrescriptionRequired:
              est.isPrescriptionRequired !== undefined
                ? est.isPrescriptionRequired
                : prev.isPrescriptionRequired,
            packageCondition: est.packageCondition || prev.packageCondition,
            storageCondition: est.storageCondition || prev.storageCondition,
            description: est.description || prev.description,
          };

          // If originalMrp wasn't manually entered yet and AI found one, calculate community price
          if (!prev.originalMrp && est.originalMrp) {
            const rulePrice = Math.round(Number(est.originalMrp) * 0.6);
            updated.originalMrp = est.originalMrp;
            if (!prev.price) {
              updated.price = rulePrice;
            }
          }

          return updated;
        });

        showToast(
          `✨ AI identified ${est.brandName || query}! Verify printed MRP and select handover point below.`,
          "success"
        );
      } else {
        showToast(res.data?.message || "Could not retrieve AI estimation.", "error");
      }
    } catch (err) {
      console.error("AI Estimate Error:", err);
      showToast(
        err.response?.data?.message || "Failed to connect to AI assistant engine.",
        "error"
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "locality") {
      const locInfo = findLocality(val);
      setFormData((prev) => ({
        ...prev,
        locality: val,
        pinCode: locInfo ? locInfo.pinCode : prev.pinCode,
        handoverPoint: locInfo ? locInfo.defaultHandover : prev.handoverPoint,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleApplySuggestedPrice = () => {
    if (pricingEval.isValid && pricingEval.suggestedPrice > 0) {
      setFormData((prev) => ({
        ...prev,
        price: pricingEval.suggestedPrice,
      }));
      showToast(`Applied MEDISAVE Suggested Price: ₹${pricingEval.suggestedPrice}`, "info");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size must be less than 5 MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!formData.storageConfirmed) {
      showToast("Please confirm that the medicine was stored under appropriate conditions.", "error");
      return;
    }

    if (expiryCheck.status === "expired") {
      showToast("Cannot submit expired medicines.", "error");
      return;
    }

    if (expiryCheck.status === "short") {
      showToast(expiryCheck.message, "error");
      return;
    }

    const numPrice = Number(formData.price);
    const numMrp = Number(formData.originalMrp) || numPrice;

    if (numMrp > 0 && numPrice > numMrp * PRICING_CONSTANTS.MAX_ALLOWED_PRICE_RATIO) {
      const maxAllowed = Math.round(numMrp * PRICING_CONSTANTS.MAX_ALLOWED_PRICE_RATIO);
      showToast(
        `Offered price cannot exceed 85% of MRP (₹${maxAllowed}). Please adjust your price.`,
        "error"
      );
      return;
    }

    if (
      !formData.brandName ||
      !formData.company ||
      !formData.category ||
      formData.price === "" ||
      !formData.quantity ||
      !formData.expiryDate ||
      !formData.locality
    ) {
      showToast("Please fill all required fields including locality and handover point.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        medicineName: formData.brandName || formData.genericName,
        brandName: formData.brandName,
        genericName: formData.genericName,
        company: formData.company,
        category: formData.category,
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity) || 1,
        unit: formData.unit,
        price: numPrice,
        originalMrp: numMrp,
        packageCondition: formData.packageCondition,
        storageCondition: formData.storageCondition,
        isPrescriptionRequired: Boolean(formData.isPrescriptionRequired),
        description: formData.description,
        locality: formData.locality,
        pinCode: formData.pinCode,
        handoverPoint: formData.handoverPoint,
        handoverRadiusKm: Number(formData.handoverRadiusKm) || 5,
        pricingRationale: pricingEval.pricingRationale,
        suggestedCommunityPrice: pricingEval.suggestedPrice || undefined,
        image: imagePreview || undefined,
      };

      const res = await api.post("/medicines", payload);

      if (res.data?.success) {
        const createdMed = res.data.data;
        const refCode = createdMed._id
          ? `#MED-${createdMed._id.slice(-6).toUpperCase()}`
          : `#MED-${Math.floor(1000 + Math.random() * 9000)}`;
        setSubmissionReference(refCode);
        setIsSubmittedSuccess(true);
        showToast("Medicine listing submitted for community moderation!", "success");
      } else {
        const msg = res.data?.message || "Failed to submit medicine listing.";
        setServerError(msg);
        showToast(msg, "error");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || "Server error while submitting medicine listing.";
      setServerError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmittedSuccess) {
    return (
      <div className="min-h-[75vh] bg-[#f7f7f4] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-[#e4e2dd] p-8 sm:p-10 max-w-lg w-full text-center shadow-sm space-y-6">
          <div className="w-16 h-16 bg-[#e8f3f1] text-[#0f4c42] rounded-full flex items-center justify-center mx-auto">
            <CheckIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
              Listing Submitted for Community Moderation
            </h2>
            <p className="text-xs sm:text-sm text-[#525252] leading-relaxed max-w-md mx-auto">
              Thank you for contributing to MEDISAVE. Your listing for{" "}
              <strong className="text-[#171717]">{formData.brandName || "Medicine"}</strong> has
              been submitted. Once approved, it will appear with priority to nearby buyers in{" "}
              <strong>{formData.locality}</strong>.
            </p>
          </div>

          <div className="bg-[#fafaf7] rounded-xl p-4 text-xs text-left text-[#525252] border border-[#e4e2dd] space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#737373]">Reference Code:</span>
              <span className="font-mono font-bold text-[#171717]">{submissionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Locality & PIN:</span>
              <span className="font-medium text-[#171717]">
                {formData.locality} ({formData.pinCode})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Handover Point:</span>
              <span className="font-medium text-[#171717] truncate max-w-[200px]">
                {formData.handoverPoint}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#737373]">Status:</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pending Admin Review
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/dashboard" className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => {
                setIsSubmittedSuccess(false);
                setFormData({
                  brandName: "",
                  genericName: "",
                  company: "",
                  category: "",
                  dosageForm: "Tablet",
                  strength: "",
                  batchNumber: "",
                  expiryDate: "",
                  quantity: "",
                  unit: "Tablets (1 strip)",
                  originalMrp: "",
                  price: "",
                  packageCondition: "Intact Sealed Blister Pack",
                  storageCondition: "Stored in cool, dry place (<25°C)",
                  isPrescriptionRequired: false,
                  storageConfirmed: false,
                  description: "",
                  locality: "Kothrud",
                  pinCode: "411038",
                  handoverPoint: "City Pride Kothrud / Vanaz Metro Station",
                  handoverRadiusKm: 5,
                });
                setImagePreview(null);
                setAiSuggestion(null);
              }}
            >
              List Another Medicine
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f4] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Header */}
        <Breadcrumb items={[{ label: "List an Unused Medicine", href: "/sell" }]} />

        {/* Page Title */}
        <div className="max-w-3xl text-left">
          <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
            Community Medicine Exchange · Pune
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight mt-1">
            List an unexpired surplus medicine
          </h1>
          <p className="text-xs sm:text-sm text-[#525252] mt-1.5 leading-relaxed">
            Help patients in your community access genuine surplus medications at fair rates while
            preventing pharmaceutical waste. MEDISAVE is a community exchange platform connecting
            nearby donors and buyers through mutually agreed handover points.
          </p>
        </div>

        {/* Two-Column Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Section Listing Form (8 cols) */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-[#e4e2dd] p-6 sm:p-8 text-left space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {serverError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* AI SMART AUTO-FILL & PHARMACEUTICAL ASSISTANT BANNER */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f4c42]/10 via-[#0f4c42]/5 to-amber-500/10 border border-[#0f4c42]/20 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0f4c42] text-white flex items-center justify-center shadow-xs">
                      <SparklesIcon className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#171717]">
                          AI Medicine Identification Assistant
                        </h2>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#0f4c42] text-white">
                          OpenRouter AI
                        </span>
                      </div>
                      <p className="text-xs text-[#525252] mt-0.5">
                        Type any medicine name — AI assists with generic salt identification, manufacturer, and standard packaging details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Search & Trigger Input Bar */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAiEstimate(aiQuery);
                        }
                      }}
                      placeholder="Enter medicine name (e.g. Dolomide, Dolo 650, Augmentin 625)..."
                      className="w-full bg-white border border-[#c4ded9] rounded-xl pl-3.5 pr-4 py-2.5 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:border-transparent transition shadow-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="shrink-0 flex items-center justify-center gap-2 px-5 font-semibold shadow-xs"
                    onClick={() => handleAiEstimate(aiQuery)}
                    isLoading={isAiLoading}
                  >
                    <SparklesIcon className="w-4 h-4 text-amber-300" />
                    <span>Auto-Fill with AI</span>
                  </Button>
                </div>

                {/* Quick 1-Click Suggestions */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-[#737373]">Try 1-click test:</span>
                  {["Dolomide", "Dolo 650", "Augmentin 625", "Pan-D", "Shelcal 500", "Azee 500"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setAiQuery(sample);
                        handleAiEstimate(sample);
                      }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#0f4c42] border border-[#0f4c42]/20 hover:border-[#0f4c42] transition shadow-2xs"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {/* AI ESTIMATION REFERENCE CARD */}
                {aiSuggestion && (
                  <div className="mt-3 p-4 bg-white/95 backdrop-blur-sm rounded-xl border border-[#0f4c42]/25 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e4e2dd]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
                          AI Identification & Reference Data
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#525252] bg-[#f0f9f8] border border-[#c4ded9] px-2 py-0.5 rounded-full">
                        AI Assistant
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                        <span className="text-[10px] text-[#737373] block uppercase font-medium">Estimated MRP</span>
                        <span className="text-sm font-bold text-[#171717]">₹{aiSuggestion.originalMrp}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 block uppercase font-bold">Standard Pack Qty</span>
                        <span className="text-sm font-extrabold text-[#0f4c42]">
                          {aiSuggestion.quantity || 10} units
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                        <span className="text-[10px] text-[#737373] block uppercase font-medium">Manufacturer</span>
                        <span className="text-xs font-bold text-[#171717] truncate block">{aiSuggestion.company || "Standard"}</span>
                      </div>
                      <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#e4e2dd]">
                        <span className="text-[10px] text-[#737373] block uppercase font-medium">Rx Requirement</span>
                        <span className={`text-xs font-bold ${aiSuggestion.isPrescriptionRequired ? "text-amber-800" : "text-emerald-700"}`}>
                          {aiSuggestion.isPrescriptionRequired ? "Schedule H (Rx)" : "OTC (No Rx)"}
                        </span>
                      </div>
                    </div>

                    {aiSuggestion.genericName && (
                      <div className="text-xs text-[#525252] bg-[#fafaf7] p-2.5 rounded-lg border border-[#e4e2dd] space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-[#171717]">Generic Salt:</strong>
                          <span className="font-mono text-[#0f4c42] bg-[#e8f3f1] px-1.5 py-0.5 rounded text-[11px]">
                            {aiSuggestion.genericName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#525252] pt-1 border-t border-[#e4e2dd]/60">
                          ℹ️ <em>AI provides guidance only. Your entered physical printed MRP and MEDISAVE community pricing rules determine the final price.</em>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 1: Medicine Identification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#e4e2dd]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                      1
                    </span>
                    <h2 className="font-bold text-[#171717] text-base">
                      Medicine Identification
                    </h2>
                  </div>
                  {formData.brandName && (
                    <button
                      type="button"
                      onClick={() => handleAiEstimate(formData.brandName)}
                      className="text-xs font-semibold text-[#0f4c42] hover:text-[#0a362f] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Re-check with AI</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#171717]">
                        Brand / Trade Name <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAiEstimate(formData.brandName)}
                        className="text-[11px] font-semibold text-[#0f4c42] hover:underline flex items-center gap-1"
                      >
                        <SparklesIcon className="w-3 h-3 text-amber-500" />
                        AI Auto-Fill
                      </button>
                    </div>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      onBlur={(e) => {
                        if (e.target.value && !formData.genericName) {
                          handleAiEstimate(e.target.value);
                        }
                      }}
                      placeholder="e.g. Crocin 500, Dolo 650, Dolomide, Azee 500"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Generic Salt / Active Formula <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleChange}
                      placeholder="e.g. Paracetamol IP, Azithromycin Dihydrate"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Manufacturer / Company <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Cipla, Sun Pharma, GSK"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Therapeutic Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    >
                      <option value="">Select therapeutic category</option>
                      {CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Dosage Form & Strength
                    </label>
                    <input
                      type="text"
                      name="strength"
                      value={formData.strength}
                      onChange={handleChange}
                      placeholder="e.g. Tablet (500mg)"
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Batch & Expiry Information */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e4e2dd]">
                  <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <h2 className="font-bold text-[#171717] text-base">
                    Batch & Expiry Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Batch Number (Printed on Pack) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      placeholder="e.g. B-9942A or GSK-P2409"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] font-mono focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                    <span className="text-[11px] text-[#737373]">
                      Must match the printed stamping on physical packaging.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Expiry Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>
                </div>

                {expiryCheck.message && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-snug flex items-start gap-2 ${
                      expiryCheck.status === "expired"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : expiryCheck.status === "short"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{expiryCheck.message}</span>
                  </div>
                )}
              </div>

              {/* SECTION 3: Physical Package Condition */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e4e2dd]">
                  <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <h2 className="font-bold text-[#171717] text-base">
                    Packaging Condition
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Packaging Condition <span className="text-rose-600">*</span>
                  </label>
                  <select
                    name="packageCondition"
                    value={formData.packageCondition}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                  >
                    <option value="Intact Sealed Blister Pack">
                      Intact Sealed Blister Pack (No tears, punctures, or cut strips)
                    </option>
                    <option value="Factory Sealed Box / Strips">
                      Factory Sealed Box with Intact Security Seal
                    </option>
                    <option value="Hermetically Sealed Foil Sachet">
                      Hermetically Sealed Foil Sachet
                    </option>
                    <option value="Unopened Bottle with Safety Ring">
                      Unopened Bottle with Safety Tamper Ring
                    </option>
                  </select>
                </div>
              </div>

              {/* SECTION 4: Quantity & Fair Community Pricing Engine */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center justify-between pb-2 border-b border-[#e4e2dd]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                      4
                    </span>
                    <h2 className="font-bold text-[#171717] text-base">
                      Quantity & Fair Community Pricing
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Available Quantity / Units <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g. 10 (tablets/capsules)"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                    <span className="text-[11px] text-[#737373] mt-1 block">
                      Packaging unit: {formData.unit || "Tablets / Units"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Actual Printed MRP (₹) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="originalMrp"
                      min="1"
                      value={formData.originalMrp}
                      onChange={handleChange}
                      placeholder="e.g. 95"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                    <span className="text-[11px] text-[#737373] mt-1 block">
                      Printed on box/strip (Authoritative base)
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#171717]">
                        Offered Listing Price (₹) <span className="text-rose-600">*</span>
                      </label>
                      {formData.originalMrp > 0 && formData.price > 0 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {Math.round(((formData.originalMrp - formData.price) / formData.originalMrp) * 100)}% off MRP
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 45"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                    <span className="text-[11px] text-[#737373] mt-1 block">
                      Max allowed: ₹{pricingEval.maxAllowedPrice || "—"} (85% of MRP)
                    </span>
                  </div>
                </div>

                {/* DETERMINISTIC MEDISAVE SUGGESTED COMMUNITY PRICE BOX */}
                {formData.originalMrp > 0 && (
                  <div className="p-4 bg-[#f0f9f8] rounded-xl border border-[#c4ded9] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#c4ded9]/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f4c42]">
                          MEDISAVE Policy Pricing Engine
                        </span>
                        <h4 className="text-sm font-bold text-[#171717] flex items-center gap-1.5">
                          <span>MEDISAVE Suggested Community Price:</span>
                          <span className="text-base text-[#0f4c42] font-mono">
                            ₹{pricingEval.suggestedPrice}
                          </span>
                          <span className="text-xs font-normal text-emerald-700">
                            ({pricingEval.discountPercentage}% discount)
                          </span>
                        </h4>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleApplySuggestedPrice}
                        className="bg-white hover:bg-emerald-50 text-[#0f4c42] border-[#0f4c42]/30 text-xs shrink-0"
                      >
                        Apply Suggested (₹{pricingEval.suggestedPrice})
                      </Button>
                    </div>

                    <div className="text-xs text-[#0a362f] space-y-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-[#525252]">Original MRP: </span>
                          <strong className="text-[#171717]">₹{formData.originalMrp}</strong>
                        </div>
                        <div>
                          <span className="text-[#525252]">Condition: </span>
                          <strong className="text-[#171717]">{formData.packageCondition.split(" ")[0]}</strong>
                        </div>
                        <div>
                          <span className="text-[#525252]">Remaining: </span>
                          <strong className="text-[#171717]">{pricingEval.monthsRemaining} months</strong>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#525252] pt-1.5 border-t border-[#c4ded9]/40 italic">
                        <strong>Pricing Rationale:</strong> {pricingEval.pricingRationale}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Community Handover (Pune Locality & Non-Logistics Model) */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e4e2dd]">
                  <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                    5
                  </span>
                  <h2 className="font-bold text-[#171717] text-base">
                    Community Handover (Pune)
                  </h2>
                </div>

                {/* NON-LOGISTICS COMMUNITY DISCLAIMER BANNER */}
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <strong className="block font-bold text-amber-900">
                    Community Exchange Policy:
                  </strong>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    MEDISAVE is designed for community-based handover. Buyers and sellers agree on a
                    convenient handover point. MEDISAVE does not currently operate its own delivery
                    network.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Locality in Pune <span className="text-rose-600">*</span>
                    </label>
                    <select
                      name="locality"
                      value={formData.locality}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    >
                      {PUNE_LOCALITIES.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name} (PIN: {loc.pinCode})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[#737373] mt-1 block">
                      Used to prioritize nearby buyers (Katraj, Hinjewadi, Kothrud, etc.)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      PIN Code <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      placeholder="e.g. 411038"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] font-mono focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Preferred Handover Point <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="handoverPoint"
                      value={formData.handoverPoint}
                      onChange={handleChange}
                      placeholder="e.g. College Main Gate / Vanaz Metro Station / Bharti Vidyapeeth Gate"
                      required
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    />
                    <span className="text-[11px] text-[#737373] mt-1 block">
                      Public landmark where you can meet the buyer
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171717] mb-1">
                      Handover Radius
                    </label>
                    <select
                      name="handoverRadiusKm"
                      value={formData.handoverRadiusKm}
                      onChange={handleChange}
                      className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                    >
                      <option value="2">2 km (Immediate Walking)</option>
                      <option value="5">5 km (Nearby Community)</option>
                      <option value="10">10 km (Extended Neighborhood)</option>
                      <option value="15">15 km (Wider City Area)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 6: Rx & Storage Certification */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e4e2dd]">
                  <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                    6
                  </span>
                  <h2 className="font-bold text-[#171717] text-base">
                    Safety & Medical Compliance
                  </h2>
                </div>

                {/* Prescription Required Toggle */}
                <div className="p-4 bg-[#fafaf7] border border-[#e4e2dd] rounded-xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPrescriptionRequired"
                      checked={formData.isPrescriptionRequired}
                      onChange={handleChange}
                      className="accent-[#0f4c42] mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#171717] block">
                        Schedule H / Rx Prescription Required
                      </span>
                      <span className="text-[11px] text-[#525252]">
                        Check this box if this medication requires a valid doctor prescription for
                        dispensation. Buyers will be required to upload an approved prescription at
                        checkout.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Storage Certification */}
                <div className="p-4 bg-[#e8f3f1] border border-[#c4ded9] rounded-xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="storageConfirmed"
                      checked={formData.storageConfirmed}
                      onChange={handleChange}
                      required
                      className="accent-[#0f4c42] mt-0.5"
                    />
                    <span className="text-xs font-medium text-[#0a362f] leading-snug">
                      I solemnly certify that this medicine was stored in a clean,
                      temperature-controlled domestic environment below 25°C and has never been
                      opened, diluted, or exposed to excessive heat or moisture.
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 7: Photo Upload */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e4e2dd]">
                  <span className="w-6 h-6 rounded-full bg-[#0f4c42] text-white font-bold text-xs flex items-center justify-center font-mono">
                    7
                  </span>
                  <h2 className="font-bold text-[#171717] text-base">
                    Packaging Photo Verification
                  </h2>
                </div>

                <div className="border-2 border-dashed border-[#e4e2dd] rounded-2xl p-6 text-center hover:border-[#0f4c42]/50 transition bg-[#fafaf7]">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Uploaded preview"
                        className="w-48 h-36 object-cover rounded-xl mx-auto border border-[#e4e2dd] shadow-xs"
                      />
                      <div className="flex justify-center gap-3">
                        <label className="text-xs font-bold text-[#0f4c42] hover:underline cursor-pointer">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-full text-[#0f4c42] border border-[#e4e2dd] flex items-center justify-center mb-2 shadow-xs">
                        <UploadIcon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-[#171717]">
                        Upload clear packaging photograph
                      </span>
                      <span className="text-xs text-[#737373] mt-1 max-w-sm">
                        Ensure batch number, expiry date, and intact packaging seal are clearly
                        visible. (PNG, JPG up to 5 MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* SECTION 8: Additional Notes */}
              <div className="space-y-4 pt-4 border-t border-[#e4e2dd]">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Donor Notes / Storage Details (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Surplus from doctor-revised recovery prescription, stored in cool cabinet"
                    className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-[#e4e2dd]">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-sm"
                  isLoading={isSubmitting}
                >
                  Submit Medicine Listing for Moderation
                </Button>
                <p className="text-[11px] text-[#737373] text-center mt-2">
                  By submitting, you confirm compliance with MEDISAVE Community Verification Guidelines.
                </p>
              </div>
            </form>
          </main>

          {/* Right Column: Sticky Guidance & Safety Checklist Panel (4 cols) */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#e4e2dd] p-6 shadow-xs space-y-6 sticky top-24 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e4e2dd]">
              <ShieldCheckIcon className="w-5 h-5 text-[#0f4c42]" />
              <h2 className="font-bold text-[#171717] text-sm">
                Listing Guidelines
              </h2>
            </div>

            <div className="space-y-3.5 text-xs text-[#525252]">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#171717] block">Physical Printed MRP Authoritative</strong>
                  The physical MRP on the pack is the ground truth. Pricing rules calculate community rates deterministically.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#171717] block">Community Handover Points</strong>
                  Handover takes place at public landmarks agreed between buyer and seller in Pune.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#171717] block">Check Expiry Date</strong>
                  Must have at least 90 days remaining from today before expiration.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#171717] block">Foil & Blister Integrity</strong>
                  No cut strips, punctured bubbles, or missing aluminum backing.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-[#171717] block">Coordinator Moderation</strong>
                  All listings are reviewed before appearing publicly in the catalogue.
                </div>
              </div>
            </div>

            {/* Prohibited Items Warning */}
            <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <strong className="flex items-center gap-1 font-bold text-rose-800">
                <AlertCircleIcon className="w-4 h-4 text-rose-700" />
                Strictly Prohibited Items:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800/90 pl-1">
                <li>Opened syrups or liquid bottles</li>
                <li>Biologics requiring cold-chain (Insulin)</li>
                <li>Schedule X psychotropics and narcotics</li>
                <li>Loose, unlabeled individual tablets</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}