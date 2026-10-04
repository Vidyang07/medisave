import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  PackageIcon,
} from "../components/common/Icons";

const PUNE_DROP_OFF_BINS = [
  {
    name: "Dhankawadi Community Health Desk & Safe Pharma Drop-Box",
    address: "Survey No. 27, Dhankawadi, Pune - 411043",
    locality: "Dhankawadi",
    timing: "Mon - Sat: 9:00 AM - 5:00 PM",
    contact: "Community Health Desk (+91 20 2437 1101)",
    accepted: "Unused blister strips, expired OTC tablets, empty medicine containers",
    managedBy: "Community Health & Environment Committee",
  },
  {
    name: "Bharati Hospital Bio-Medical Waste Collection Center",
    address: "Pune-Satara Road, Katraj, Pune - 411046",
    locality: "Katraj",
    timing: "24/7 (Pharmacy Ground Floor)",
    contact: "Dispensary In-Charge (+91 20 2437 3226)",
    accepted: "Expired syrups, antibiotics, Schedule H blisters, prescription vials",
    managedBy: "Bharati Vidyapeeth Health System",
  },
  {
    name: "Katraj PMC Urban Health Center & Jan Aushadhi Kendra",
    address: "Near Katraj PMT Bus Depot, Katraj Chowk, Pune - 411046",
    locality: "Katraj",
    timing: "Mon - Sat: 8:30 AM - 4:00 PM",
    contact: "PMC Health Officer",
    accepted: "General expired household medications, blister foils, ointments",
    managedBy: "Pune Municipal Corporation (PMC)",
  },
  {
    name: "Padmavati Community Dispensary Drop Point",
    address: "Near Padmavati Temple, Pune-Satara Link Road, Pune - 411037",
    locality: "Bibvewadi / Dhankawadi",
    timing: "Mon - Fri: 9:00 AM - 2:00 PM",
    contact: "Community Health Nurse",
    accepted: "Tablets, capsules, non-hazardous oral supplements",
    managedBy: "Janaseva Outreach Initiative",
  },
];

export default function DisposalGuide() {
  const [selectedLocality, setSelectedLocality] = useState("All");

  const filteredBins =
    selectedLocality === "All"
      ? PUNE_DROP_OFF_BINS
      : PUNE_DROP_OFF_BINS.filter((b) => b.locality.toLowerCase().includes(selectedLocality.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#171717] pb-16">
      {/* Top Hero Banner */}
      <div className="bg-[#1b4332] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#143225]">
        <div className="max-w-7xl mx-auto text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2d6a4f] text-[#b7e4c7] text-xs font-semibold uppercase tracking-wider mb-3">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-[#d8f3dc]" />
            UN SDG 12: Responsible Consumption & Environmental Protection
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Safe Pharmaceutical Disposal & Green Healthcare Guide
          </h1>
          <p className="mt-2 text-sm text-[#d8f3dc] max-w-3xl leading-relaxed">
            Flushing expired medicines down toilets or throwing them into domestic garbage pollutes Pune's Mula-Mutha river basin and fuels Anti-Microbial Resistance (AMR). Learn how to neutralize and safely drop off expired drugs.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="#drop-off-bins"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b7e4c7] text-[#1b4332] hover:bg-[#95d5b2] text-xs font-bold rounded-lg transition shadow-sm"
            >
              <MapPinIcon className="w-4 h-4" />
              Find Pune Drop-off Collection Bins
            </a>
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white hover:bg-[#20503b] text-xs font-bold rounded-lg transition border border-[#40916c]"
            >
              <PackageIcon className="w-4 h-4" />
              Check if Unexpired Stock is Donatable
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-left space-y-10">
        {/* Why Safe Disposal Matters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#e4e2dd] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#ffe4e6] text-[#be123c] flex items-center justify-center font-bold text-lg mb-3">
              ⚠️
            </div>
            <h2 className="text-sm font-bold text-[#171717]">Anti-Microbial Resistance (AMR)</h2>
            <p className="text-xs text-[#525252] mt-2 leading-relaxed">
              When leftover antibiotics are discarded into sewers, trace chemicals enter the local water supply. Bacteria mutate into multi-drug resistant superbugs that current medications cannot cure.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#e4e2dd] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-lg mb-3">
              🌊
            </div>
            <h2 className="text-sm font-bold text-[#171717]">Pune River Basin Contamination</h2>
            <p className="text-xs text-[#525252] mt-2 leading-relaxed">
              Municipal sewage treatment plants cannot filter complex synthetic pharmaceutical compounds. Unchecked disposal poisons groundwater and aquatic flora in the Mula-Mutha river.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#e4e2dd] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#fef3c7] text-[#92400e] flex items-center justify-center font-bold text-lg mb-3">
              🛡️
            </div>
            <h2 className="text-sm font-bold text-[#171717]">Accidental Ingestion Prevention</h2>
            <p className="text-xs text-[#525252] mt-2 leading-relaxed">
              Keeping expired or unlabelled medicines in home cabinets leads to dangerous accidental consumption by children, pets, or elderly family members with blurred vision.
            </p>
          </div>
        </div>

        {/* Conservative Medical Notice & Safe Disposal Steps */}
        <div className="bg-white p-6 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-4">
          <div className="p-3.5 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2.5">
            <AlertTriangleIcon className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Medical Safety Advisory:</strong>
              Do not use expired medicines. Keep them separate and follow authorised pharmacy/collection-point or local disposal guidance. Do not attempt home chemical neutralization.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-[#0f4c42]" />
            <h2 className="text-base font-bold text-[#171717]">
              Safe Household Disposal Steps (When Dedicated Drop-Off Bins Are Inaccessible)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]">
              <span className="text-xs font-black text-[#0f4c42] block mb-1">Step 01</span>
              <h3 className="text-xs font-bold text-[#171717]">Do NOT Crush Tablets</h3>
              <p className="text-[11px] text-[#525252] mt-1">
                Keep tablets whole to avoid releasing active chemical airborne particles into household air.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]">
              <span className="text-xs font-black text-[#0f4c42] block mb-1">Step 02</span>
              <h3 className="text-xs font-bold text-[#171717]">Mix with Undesirable Waste</h3>
              <p className="text-[11px] text-[#525252] mt-1">
                Mix tablets with used coffee grounds, wet soil, or cat litter to make them unpalatable to stray animals.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]">
              <span className="text-xs font-black text-[#0f4c42] block mb-1">Step 03</span>
              <h3 className="text-xs font-bold text-[#171717]">Seal in a Container</h3>
              <p className="text-[11px] text-[#525252] mt-1">
                Place the mixture in a leak-proof sealable pouch or plastic container to prevent liquid seepage.
              </p>
            </div>

            <div className="p-4 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]">
              <span className="text-xs font-black text-[#0f4c42] block mb-1">Step 04</span>
              <h3 className="text-xs font-bold text-[#171717]">Scratch Out Patient Details</h3>
              <p className="text-[11px] text-[#525252] mt-1">
                Deface prescription labels, doctor names, and patient PRNs with a permanent marker before recycling packaging.
              </p>
            </div>
          </div>
        </div>

        {/* Pune Drop-off Locator */}
        <div id="drop-off-bins" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[#0f4c42]" />
                Pune Safe Pharmaceutical Drop-Off Bins & Collection Centers
              </h2>
              <p className="text-xs text-[#78350f] bg-[#fef3c7] border border-[#fde68a] px-3 py-1 rounded-md mt-1 inline-block">
                ⚠️ <em>Example disposal locations — verify availability before visiting. Prototype educational guide for community awareness.</em>
              </p>
            </div>

            <div>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="text-xs bg-white border border-[#e4e2dd] rounded-lg px-3 py-1.5 font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              >
                <option value="All">All Localities</option>
                <option value="Dhankawadi">Dhankawadi</option>
                <option value="Katraj">Katraj</option>
                <option value="Bibvewadi">Bibvewadi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBins.map((bin, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#171717]">{bin.name}</h3>
                  <span className="text-[10px] bg-[#e8f3f1] text-[#0f4c42] font-bold px-2 py-0.5 rounded uppercase">
                    {bin.locality}
                  </span>
                </div>

                <div className="text-xs text-[#525252] space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-[#0f4c42] shrink-0" />
                    <span>{bin.address}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-[#171717]">Operating Hours:</span> {bin.timing}
                  </p>
                  <p>
                    <span className="font-semibold text-[#171717]">Accepted Items:</span> {bin.accepted}
                  </p>
                  <p className="text-[11px] text-[#737373] pt-1">
                    Managed by: <span className="font-semibold text-[#262626]">{bin.managedBy}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
