import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import MedicineCard from "../components/MedicineCard";
import WhyChoose from "../components/WhyChoose";
import { INITIAL_MEDICINES, CATEGORIES } from "../data/mockData";
import {
  ShieldCheckIcon,
  ClockIcon,
  PackageIcon,
  PillIcon,
  ArrowRightIcon,
  CheckIcon,
  AlertCircleIcon,
  FileTextIcon,
  UploadIcon,
} from "../components/common/Icons";
import { Button } from "../components/common/Button";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES.slice(0, 8));
  const [totalCount, setTotalCount] = useState(INITIAL_MEDICINES.length);

  useEffect(() => {
    let isMounted = true;
    const params = { limit: 8 };
    if (selectedCategory !== "All Categories") {
      params.category = selectedCategory;
    }

    api
      .get("/medicines", { params })
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data?.length > 0) {
          setMedicines(res.data.data);
          if (res.data.pagination?.total) {
            setTotalCount(res.data.pagination.total);
          }
        }
      })
      .catch(() => {
        // Keep initial fallback state
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Compact Trust Strip */}
      <section className="bg-white border-b border-[#e4e2dd] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#eceae5]">
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center shrink-0 border border-[#c4ded9]">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] leading-tight">
                  Pre-Verified
                </h4>
                <p className="text-[11px] text-[#525252]">Every pack inspected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center shrink-0 border border-[#c4ded9]">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] leading-tight">
                  Expiry Guaranteed
                </h4>
                <p className="text-[11px] text-[#525252]">Min. 90-day buffer</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center shrink-0 border border-[#c4ded9]">
                <PackageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] leading-tight">
                  Intact Packaging
                </h4>
                <p className="text-[11px] text-[#525252]">No loose or cut strips</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center shrink-0 border border-[#c4ded9]">
                <PillIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] leading-tight">
                  Community Regulated
                </h4>
                <p className="text-[11px] text-[#525252]">Fair peer pricing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search Bar with Quick Tags */}
      <SearchBar />

      {/* 4. Featured / Recently Listed Medicines */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
          <div>
            <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
              Available Listings
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#171717] tracking-tight mt-1">
              Recently listed unexpired medicines
            </h2>
            <p className="text-xs sm:text-sm text-[#525252] mt-1">
              Browse authentic surplus medicines verified from registered donors across Pune.
            </p>
          </div>

          <Link
            to="/buy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f4c42] hover:text-[#0a362f] bg-[#e8f3f1] hover:bg-[#d5ebe7] px-3.5 py-2 rounded-lg border border-[#c4ded9] transition shrink-0"
          >
            <span>View all {totalCount}+ listings</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.slice(0, 7).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#0f4c42] text-white shadow-2xs"
                  : "bg-white text-[#525252] border border-[#e4e2dd] hover:border-[#d1cfc7] hover:bg-[#fafaf7]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Medicine Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine._id || medicine.id} medicine={medicine} />
          ))}
        </div>

        {/* Bottom CTA to Full Catalogue */}
        <div className="mt-10 text-center">
          <Link to="/buy">
            <Button variant="outline" size="lg" className="shadow-2xs">
              Explore Full Medicine Catalogue ({totalCount} items)
              <ArrowRightIcon className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. How MEDISAVE Works */}
      <section id="how-it-works" className="bg-white border-t border-b border-[#e4e2dd] py-14 sm:py-18 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
              Simple & Safe Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight mt-1">
              How the MEDISAVE exchange works
            </h2>
            <p className="text-xs sm:text-sm text-[#525252] mt-2 leading-relaxed">
              A structured 4-step workflow to ensure medical safety, verified authenticity, and seamless community access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 sm:p-6 rounded-xl bg-[#fafaf7] border border-[#e4e2dd] flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-[#0f4c42]/30 font-mono block mb-2">
                  01
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#171717] mb-1.5">
                  Find or List Medicine
                </h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Search by salt name, brand, or manufacturer. Alternatively, list your sealed, unexpired surplus medications in minutes.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-[#fafaf7] border border-[#e4e2dd] flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-[#0f4c42]/30 font-mono block mb-2">
                  02
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#171717] mb-1.5">
                  Review Batch & Expiry
                </h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Inspect manufacturer batch numbers, expiry countdowns, storage guidelines, and blister pack condition.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-[#fafaf7] border border-[#e4e2dd] flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-[#0f4c42]/30 font-mono block mb-2">
                  03
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#171717] mb-1.5">
                  Place Request Order
                </h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Submit a request for required dosage units at fair community pricing with zero hidden surcharges.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-[#fafaf7] border border-[#e4e2dd] flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-[#0f4c42]/30 font-mono block mb-2">
                  04
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#171717] mb-1.5">
                  Verified Handover
                </h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Physical packaging is re-checked upon community handover or localized pickup in Pune, ensuring complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Prescription Verification Safety Architecture */}
      <section className="bg-[#f7f7f4] py-14 sm:py-18 text-left border-b border-[#e4e2dd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#e4e2dd] p-6 sm:p-10 shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold">
                  <FileTextIcon className="w-3.5 h-3.5 text-purple-700" />
                  <span>Prescription Safety Compliance</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                  Secure prescription verification for Schedule H medicines
                </h2>
                <p className="text-xs sm:text-sm text-[#525252] leading-relaxed">
                  MEDISAVE strictly protects community safety. Prescription-required medicines cannot be ordered without a physician prescription approved by our coordinator team. Documents are stored privately with end-to-end access control.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd] text-xs">
                    <strong className="text-[#171717] block mb-0.5">1. Private Upload</strong>
                    <span className="text-[#737373] text-[11px]">Encrypted PDF/image storage</span>
                  </div>
                  <div className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd] text-xs">
                    <strong className="text-[#171717] block mb-0.5">2. Medical Review</strong>
                    <span className="text-[#737373] text-[11px]">Doctor registration validation</span>
                  </div>
                  <div className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd] text-xs">
                    <strong className="text-[#171717] block mb-0.5">3. Safe Checkout</strong>
                    <span className="text-[#737373] text-[11px]">Server-verified order binding</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-purple-50/60 rounded-xl border border-purple-200 p-5 space-y-3">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                  Prescription Checklist
                </h4>
                <ul className="space-y-2 text-xs text-purple-900">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <span>Legible doctor name and registration number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <span>Patient name matching account details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <span>Prescription issued within valid medical timeframe</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-purple-200">
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="w-full bg-white text-purple-900 border-purple-300 hover:bg-purple-100">
                      <UploadIcon className="w-3.5 h-3.5 mr-1" />
                      Manage Prescriptions in Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why MEDISAVE Pillars */}
      <WhyChoose />

      {/* 8. Community CTA Banner */}
      <section className="bg-[#0f4c42] text-white py-14 sm:py-16 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold text-[#a7f3d0] uppercase tracking-wider">
                Community Contribution
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Have unexpired, sealed medicines at home?
              </h2>
              <p className="text-xs sm:text-sm text-[#d1fae5] leading-relaxed">
                Give your surplus medications a second life. List them on MEDISAVE to help community members access affordable healthcare while reducing pharmaceutical waste.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/sell">
                <Button variant="secondary" size="lg" className="bg-white text-[#0f4c42] hover:bg-[#e8f3f1] font-bold shadow-sm">
                  List Unused Medicine
                  <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/buy">
                <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Medicine Safety & Academic Advisory Section */}
      <section className="bg-[#f2f1ec] border-t border-b border-[#e4e2dd] py-14 sm:py-18 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-[#e4e2dd] p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-5 border-b border-[#e4e2dd]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9f1239] uppercase tracking-wider">
                  <AlertCircleIcon className="w-4 h-4 text-[#be123c]" />
                  <span>Pharmaceutical Quality & Safety Advisory</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#171717]">
                  Medicine information matters. Safety is non-negotiable.
                </h3>
              </div>
              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3.5 py-2 text-xs text-[#92400e] max-w-md">
                <strong>Mandatory Rule:</strong> Opened bottles, punctured blister foils, and temperature-sensitive biologics (such as Insulin) are strictly prohibited from listing.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] flex items-center gap-1.5">
                  <CheckIcon className="w-4 h-4 text-[#0f4c42]" />
                  Expiry Date & Storage Integrity
                </h4>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Every listed medicine must have a minimum 90-day shelf life remaining. Donors must declare that medicines were stored in dry conditions below 25°C.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] flex items-center gap-1.5">
                  <CheckIcon className="w-4 h-4 text-[#0f4c42]" />
                  Prescription (Rx) Compliance
                </h4>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Schedule H and H1 medications require a valid physician prescription confirmation upon request fulfillment before checkout.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] flex items-center gap-1.5">
                  <CheckIcon className="w-4 h-4 text-[#0f4c42]" />
                  Community Verification
                </h4>
                <p className="text-xs text-[#525252] leading-relaxed">
                  All listings undergo manual review by student coordinators before becoming visible in the public catalogue.
                </p>
              </div>
            </div>

            {/* Academic Disclaimer Box */}
            <div className="mt-6 pt-4 border-t border-[#eceae5] bg-[#fafaf7] rounded-lg p-3.5 text-xs text-[#525252] leading-relaxed">
              <p>
                <strong className="text-[#171717]">Project Disclaimer:</strong> MEDISAVE is a student engagement initiative developed for college community research. It does not replace professional medical advice or licensed pharmaceutical distribution. Always consult a qualified physician before consuming any medication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Prototype Status, Limitations & Future Scope */}
      <section className="bg-white py-14 sm:py-16 text-left border-t border-[#e4e2dd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
              Project Transparency & Research Scope
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Current Prototype & Future Deployment
            </h2>
            <p className="text-xs sm:text-sm text-[#525252]">
              Honest technical breakdown of implemented capabilities versus research limitations and real-world deployment prerequisites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Current Prototype */}
            <div className="bg-[#f7f7f4] rounded-2xl border border-[#e4e2dd] p-6 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="font-bold text-[#171717] text-base">Current Prototype</h3>
              </div>
              <p className="text-xs text-[#525252]">MEDISAVE currently demonstrates:</p>
              <ul className="space-y-1.5 text-xs text-[#525252]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>verified community members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>medicine listing moderation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>expiry validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>locality-based matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>deterministic community pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>AI-assisted medicine information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>prescription verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>secure prescription access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>order and handover workflow</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Current Limitations */}
            <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] p-6 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-[#92400e] text-base">Current Limitations</h3>
              </div>
              <p className="text-xs text-[#78350f]">Prototype constraints & boundaries:</p>
              <ul className="space-y-2 text-xs text-[#78350f]">
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Geographic distance is currently used rather than live road routing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>MEDISAVE does not operate its own delivery fleet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Prescription verification is an administrative workflow and should be handled by appropriately qualified personnel in a real deployment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Medicine redistribution would require compliance with applicable Indian pharmaceutical regulations before real-world operation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>AI-generated medicine information requires seller/user confirmation.</span>
                </li>
              </ul>
            </div>

            {/* Box 3: Future Deployment */}
            <div className="bg-[#f0f9f8] rounded-2xl border border-[#c4ded9] p-6 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f4c42]"></span>
                <h3 className="font-bold text-[#0f4c42] text-base">Future Deployment</h3>
              </div>
              <p className="text-xs text-[#0a362f]">Potential future integrations:</p>
              <ul className="space-y-2 text-xs text-[#0a362f]">
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>community/NGO collection points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>licensed pharmacy/healthcare partners</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>external logistics providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>geospatial/road-distance services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>OCR for batch and expiry verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>stronger identity verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0f4c42] font-bold">→</span>
                  <span>production cloud storage and monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}