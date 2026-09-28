import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import MedicineCard from "../components/MedicineCard";
import WhyChoose from "../components/WhyChoose";
import { INITIAL_MEDICINES, CATEGORIES } from "../data/mockData";
import {
  ArrowRightIcon,
  CheckIcon,
  AlertCircleIcon,
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
    <div className="min-h-screen bg-[#f8f7f4] text-left">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Compact Register Bar */}
      <section className="bg-white border-b-2 border-[#27272a] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs divide-y sm:divide-y-0 sm:divide-x divide-[#d4d4d8]">
            <div className="pt-2 sm:pt-0 sm:px-3 text-left">
              <span className="stamp-green text-[10px] block mb-1">AUDIT VERIFIED</span>
              <h4 className="font-bold text-[#141416] text-xs">Packaging Inspected</h4>
              <p className="text-[11px] text-[#52525b]">Sealed blister foils only</p>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3 text-left">
              <span className="stamp-box text-[10px] block mb-1">90-DAY BUFFER</span>
              <h4 className="font-bold text-[#141416] text-xs">Expiry Guaranteed</h4>
              <p className="text-[11px] text-[#52525b]">No short-dated medicines</p>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3 text-left">
              <span className="stamp-rx text-[10px] block mb-1">Rx MANDATE</span>
              <h4 className="font-bold text-[#141416] text-xs">Doctor Prescription</h4>
              <p className="text-[11px] text-[#52525b]">Schedule H compliance</p>
            </div>

            <div className="pt-2 sm:pt-0 sm:px-3 text-left">
              <span className="stamp-foil text-[10px] block mb-1">DETERMINISTIC</span>
              <h4 className="font-bold text-[#141416] text-xs">40%–65% Off MRP</h4>
              <p className="text-[11px] text-[#52525b]">Non-profit community rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search Bar with Quick Tags */}
      <SearchBar />

      {/* 4. Featured / Recently Listed Medicines */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b-2 border-[#27272a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="stamp-box text-[10px]">REGISTERED STOCKS</span>
              <span className="stamp-green text-[10px]">ACTIVE PUNE INVENTORY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#141416] tracking-tight mt-1">
              Recently Listed Unexpired Medicines
            </h2>
            <p className="text-xs sm:text-sm text-[#4b4d52] font-mono mt-1">
              Surplus sealed medicines verified from community donors across Katraj, Kothrud, Hinjewadi, and Baner.
            </p>
          </div>

          <Link
            to="/buy"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-[#166534] hover:bg-[#14532d] px-3.5 py-2 border border-[#166534] transition shrink-0"
          >
            <span>View Chemist Price Sheet ({totalCount}+)</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none font-mono text-xs">
          {CATEGORIES.slice(0, 7).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-bold whitespace-nowrap transition cursor-pointer border border-[#27272a] ${
                selectedCategory === cat
                  ? "bg-[#166534] text-white"
                  : "bg-white text-[#27272a] hover:bg-[#f0eee7]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Medicine Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine._id || medicine.id} medicine={medicine} />
          ))}
        </div>

        {/* Bottom CTA to Full Catalogue */}
        <div className="mt-8 text-center">
          <Link to="/buy">
            <Button variant="outline" size="md">
              Explore Full Chemist Price Sheet ({totalCount} items)
              <ArrowRightIcon className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. How MEDISAVE Works */}
      <section id="how-it-works" className="bg-white border-t-2 border-b-2 border-[#27272a] py-10 sm:py-14 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="stamp-box text-[10px] mb-1 inline-block">EXCHANGE PROTOCOL</span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#141416] tracking-tight mt-1">
              How the Pune Community Exchange Works
            </h2>
            <p className="text-xs sm:text-sm text-[#4b4d52] font-mono mt-1 leading-relaxed">
              A 4-step verified workflow ensuring packaging authenticity, prescription validation, and local handover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-[#f8f7f4] border-2 border-[#27272a] flex flex-col justify-between">
              <div>
                <span className="text-lg font-bold text-[#166534] block mb-1">
                  [STEP 01]
                </span>
                <h3 className="text-sm font-bold font-heading text-[#141416] mb-1">
                  List or Search Medicine
                </h3>
                <p className="text-xs text-[#4b4d52] font-sans leading-relaxed">
                  Enter printed brand, salt formulation, and printed MRP. AI extracts compositions and pricing policy calculates the community rate.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f8f7f4] border-2 border-[#27272a] flex flex-col justify-between">
              <div>
                <span className="text-lg font-bold text-[#166534] block mb-1">
                  [STEP 02]
                </span>
                <h3 className="text-sm font-bold font-heading text-[#141416] mb-1">
                  Admin Inspection
                </h3>
                <p className="text-xs text-[#4b4d52] font-sans leading-relaxed">
                  Coordinators review high-resolution blister pack photos to verify batch number, intact foil seal, and printed expiry date.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f8f7f4] border-2 border-[#27272a] flex flex-col justify-between">
              <div>
                <span className="text-lg font-bold text-[#166534] block mb-1">
                  [STEP 03]
                </span>
                <h3 className="text-sm font-bold font-heading text-[#141416] mb-1">
                  Rx Review & Order
                </h3>
                <p className="text-xs text-[#4b4d52] font-sans leading-relaxed">
                  For Schedule H medicines, buyer uploads a registered doctor prescription. Upon coordinator approval, order is confirmed.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f8f7f4] border-2 border-[#27272a] flex flex-col justify-between">
              <div>
                <span className="text-lg font-bold text-[#166534] block mb-1">
                  [STEP 04]
                </span>
                <h3 className="text-sm font-bold font-heading text-[#141416] mb-1">
                  Pune Handover
                </h3>
                <p className="text-xs text-[#4b4d52] font-sans leading-relaxed">
                  Buyer and donor meet at Katraj Chowk, Vanaz Metro, or PICT Campus Dispensary. Physical blister foil is verified before exchange.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Prescription Verification Safety Architecture */}
      <section className="bg-[#f8f7f4] py-10 sm:py-14 text-left border-b-2 border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-[#27272a] p-5 sm:p-8 rx-stripe-top">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="stamp-rx text-[10px]">SCHEDULE H COMPLIANCE</span>
                  <span className="stamp-box text-[10px]">PRIVATE DOCUMENT STORAGE</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#141416] tracking-tight">
                  Strict Prescription Verification Architecture
                </h2>
                <p className="text-xs sm:text-sm text-[#4b4d52] leading-relaxed font-sans">
                  Schedule H and H1 antibiotic or cardiovascular medications strictly require an approved physician prescription before checkout. Prescriptions are stored outside public web directories with cryptographic access tokens.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 font-mono text-xs">
                  <div className="p-2.5 bg-[#f8f7f4] border border-[#27272a]">
                    <strong className="text-[#141416] block text-[11px] mb-0.5">1. Private Streaming</strong>
                    <span className="text-[#52525b] text-[10px]">No static file URLs</span>
                  </div>
                  <div className="p-2.5 bg-[#f8f7f4] border border-[#27272a]">
                    <strong className="text-[#141416] block text-[11px] mb-0.5">2. Medical Audit</strong>
                    <span className="text-[#52525b] text-[10px]">Doctor registration check</span>
                  </div>
                  <div className="p-2.5 bg-[#f8f7f4] border border-[#27272a]">
                    <strong className="text-[#141416] block text-[11px] mb-0.5">3. Server Binding</strong>
                    <span className="text-[#52525b] text-[10px]">Zero client override</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#fef2f2] border-2 border-[#b91c1c] p-4 space-y-2.5 font-mono text-xs text-[#141416]">
                <div className="flex items-center justify-between border-b border-[#fca5a5] pb-1.5">
                  <span className="font-bold text-[#b91c1c] uppercase text-[11px]">Prescription Protocol</span>
                  <span className="stamp-rx text-[9px]">MANDATORY</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#7f1d1d] font-sans">
                  <li className="flex items-start gap-1.5">
                    <CheckIcon className="w-3.5 h-3.5 text-[#b91c1c] shrink-0 mt-0.5" />
                    <span>Legible doctor name and medical council registration</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckIcon className="w-3.5 h-3.5 text-[#b91c1c] shrink-0 mt-0.5" />
                    <span>Patient name matching account profile</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckIcon className="w-3.5 h-3.5 text-[#b91c1c] shrink-0 mt-0.5" />
                    <span>Prescription issued within valid clinical timeframe</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-[#fca5a5]">
                  <Link to="/dashboard">
                    <button className="w-full py-1.5 bg-[#b91c1c] text-white font-mono font-bold text-xs border border-[#b91c1c] hover:bg-[#991b1b] cursor-pointer">
                      Manage Prescriptions in Dashboard →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why MEDISAVE Pillars */}
      <WhyChoose />

      {/* 8. Community Contribution Banner */}
      <section className="bg-[#141416] text-[#f8f7f4] py-10 sm:py-14 text-left border-b-2 border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl font-mono">
              <span className="stamp-green text-[10px]">COMMUNITY DONATION INITIATIVE</span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                Have sealed, unexpired medicines at home in Pune?
              </h2>
              <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-sans">
                Do not throw intact medicine strips into municipal waste. List them on MEDISAVE to help neighbors access affordable medicines at non-profit community rates.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link to="/sell">
                <Button variant="primary" size="md">
                  List Surplus Medicine Strip
                </Button>
              </Link>
              <Link to="/buy">
                <Button variant="secondary" size="md">
                  Browse Price Sheet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Academic Project Disclaimer */}
      <section className="bg-[#f0eee7] py-6 text-left font-mono text-xs text-[#52525b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-[#27272a] bg-white p-3.5 space-y-1">
            <div className="font-bold text-[#141416] uppercase text-[11px] flex items-center gap-1.5">
              <AlertCircleIcon className="w-3.5 h-3.5 text-[#b91c1c]" />
              <span>Pune Institute of Computer Technology (PICT) · Community Engagement Program</span>
            </div>
            <p className="text-[11px] text-[#52525b] font-sans">
              MEDISAVE is an academic software prototype developed by SY 2 (Batch H2) students for community health research. It does not replace licensed retail pharmacies or emergency medical services.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}