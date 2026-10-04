import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  PillIcon,
  FileTextIcon,
} from "./common/Icons";
import { Button } from "./common/Button";

export default function Hero() {
  const [activeInspectionView, setActiveInspectionView] = useState("front"); // 'front', 'specs', 'safety'

  return (
    <section className="relative overflow-hidden bg-[#fafaf7] border-b border-[#e4e2dd] py-12 sm:py-16 lg:py-20 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Hero Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Health Community Badge */}
            <div className="inline-flex items-center gap-2 bg-[#e8f3f1] border border-[#c4ded9] px-3.5 py-1 rounded-full text-xs font-semibold text-[#0f4c42]">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
              <span>Verified Community Medicine Donation Platform</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#171717] tracking-tight leading-[1.14]">
              Give unused medicines <br />
              <span className="text-[#0f4c42]">a better destination.</span>
            </h1>

            {/* Clear Sub-paragraph */}
            <p className="text-sm sm:text-base text-[#525252] leading-relaxed max-w-xl font-normal">
              Connect eligible unused medicines with verified community healthcare partners while keeping expiry and safe-disposal awareness at the center.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/sell">
                <Button variant="primary" size="lg" className="shadow-2xs">
                  Donate Medicine
                  <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="border border-[#e4e2dd] shadow-2xs">
                  Explore How It Works
                </Button>
              </a>
            </div>

            {/* Key Trust Pillars */}
            <div className="pt-5 grid grid-cols-3 gap-3 border-t border-[#e4e2dd] max-w-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
                  <span className="w-4 h-4 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Batch Checked</span>
                </div>
                <p className="text-[11px] text-[#737373] leading-tight">
                  Min. 90-day shelf life
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
                  <span className="w-4 h-4 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Sealed Packs</span>
                </div>
                <p className="text-[11px] text-[#737373] leading-tight">
                  Intact blister foils only
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
                  <span className="w-4 h-4 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Rx Verified</span>
                </div>
                <p className="text-[11px] text-[#737373] leading-tight">
                  Doctor approval required
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Interactive Product & Inspection Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-white rounded-2xl border border-[#e4e2dd] shadow-sm p-6 space-y-5">
              {/* Header with Mode Toggles */}
              <div className="flex items-center justify-between pb-3 border-b border-[#eceae5]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse" />
                  <span className="text-xs font-bold text-[#171717] tracking-wide uppercase">
                    Verified Package Showcase
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-[#737373]">
                  BATCH #GSK-8821
                </span>
              </div>

              {/* Inspection View Controls */}
              <div className="grid grid-cols-3 gap-1 bg-[#f2f1ec] p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveInspectionView("front")}
                  className={`py-1 text-center font-semibold rounded-md transition cursor-pointer ${
                    activeInspectionView === "front"
                      ? "bg-white text-[#0f4c42] shadow-2xs"
                      : "text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  Donation Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectionView("specs")}
                  className={`py-1 text-center font-semibold rounded-md transition cursor-pointer ${
                    activeInspectionView === "specs"
                      ? "bg-white text-[#0f4c42] shadow-2xs"
                      : "text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  Packaging Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectionView("safety")}
                  className={`py-1 text-center font-semibold rounded-md transition cursor-pointer ${
                    activeInspectionView === "safety"
                      ? "bg-white text-[#0f4c42] shadow-2xs"
                      : "text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  Rx Safety
                </button>
              </div>

              {/* Dynamic View Content */}
              {activeInspectionView === "front" && (
                <div className="space-y-3">
                  <div className="flex gap-3.5 items-center p-3.5 bg-[#f7f7f4] rounded-xl border border-[#e4e2dd]">
                    <img
                      src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80"
                      alt="Medicine blister package"
                      className="w-20 h-20 object-cover rounded-lg border border-[#e4e2dd] shrink-0 bg-white"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#0f4c42] bg-[#e8f3f1] px-1.5 py-0.5 rounded border border-[#c4ded9]">
                          Pain Relief
                        </span>
                        <span className="text-[10px] text-[#525252] font-mono">
                          Tablet (500mg)
                        </span>
                      </div>
                      <h4 className="font-bold text-[#171717] text-sm sm:text-base leading-tight truncate">
                        Paracetamol Tablets IP
                      </h4>
                      <p className="text-xs text-[#525252] truncate">
                        GlaxoSmithKline Pharmaceuticals
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-xs font-bold text-[#065f46] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded">
                          🎁 100% Free Donation
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-2 px-3 bg-[#fafaf7] rounded-lg border border-[#eceae5]">
                      <span className="text-[#525252]">Expiry Date:</span>
                      <span className="font-semibold text-[#171717] flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                        April 2027 (13 months buffer)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-[#fafaf7] rounded-lg border border-[#eceae5]">
                      <span className="text-[#525252]">Package Condition:</span>
                      <span className="font-semibold text-[#15803d] flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5" />
                        Intact Sealed Blister Strip
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeInspectionView === "specs" && (
                <div className="space-y-2.5 text-xs text-left">
                  <div className="p-3 bg-[#f7f7f4] rounded-xl border border-[#e4e2dd] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#171717]">
                      <PillIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                      <span>Physical Blister Inspection Rules</span>
                    </div>
                    <p className="text-[11px] text-[#525252] leading-relaxed">
                      Every blister cavity must remain hermetically sealed by aluminum backing. No cut strips, crushed boxes, or unsealed syrups are permitted.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#eceae5]">
                      <span className="text-[10px] text-[#737373] uppercase block font-semibold">
                        Storage Condition
                      </span>
                      <strong className="text-[11px] text-[#171717]">Below 25°C Dry</strong>
                    </div>
                    <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#eceae5]">
                      <span className="text-[10px] text-[#737373] uppercase block font-semibold">
                        Donation Origin
                      </span>
                      <strong className="text-[11px] text-[#171717]">Pune, MH Donor</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeInspectionView === "safety" && (
                <div className="space-y-2.5 text-xs text-left">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 text-purple-950">
                    <div className="flex items-center gap-1.5 font-bold">
                      <FileTextIcon className="w-3.5 h-3.5 text-purple-700" />
                      <span>Prescription Verification Architecture</span>
                    </div>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      Schedule H and H1 medications require a registered physician prescription uploaded and approved by coordinators prior to verified handover and distribution.
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#fafaf7] rounded-lg border border-[#eceae5] text-[11px] text-[#525252]">
                    ✓ Valid doctor registration number checked against national medical registry.
                  </div>
                </div>
              )}

              {/* Card Footer Note */}
              <div className="pt-2 border-t border-[#eceae5] flex items-center justify-between text-[11px] text-[#737373]">
                <span className="flex items-center gap-1 text-[#0f4c42] font-semibold">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  Coordinator Verified
                </span>
                <span>Pune Community Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}