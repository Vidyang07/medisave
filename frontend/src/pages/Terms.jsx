import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/common/Breadcrumb";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Terms of Service" },
          ]}
        />

        <div className="bg-white rounded-none border-2 border-[#27272a] p-6 sm:p-10 text-left mt-4 space-y-8">
          {/* Header */}
          <div className="border-b-2 border-[#27272a] pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[#b91c1c] tracking-widest uppercase">
                [PROTOCOL-REGULATION]
              </span>
              <span className="stamp-box text-[10px] font-mono uppercase">
                CEP-PUNE-2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight uppercase">
              Community Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-[#52525b] font-mono mt-2">
              Revision: September 2026. Non-commercial peer redistribution and physical inspection guidelines.
            </p>
          </div>

          {/* Section 1: Nature of Platform */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 1. Non-Commercial Academic Exchange Protocol
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              MEDISAVE is an academic community initiative designed for research on reducing unused medicine waste and improving localized access to surplus, unexpired medicines. MEDISAVE is not a commercial pharmacy, licensed drug manufacturer, or medical distributor.
            </p>
          </section>

          {/* Section 2: Medicine Eligibility & Strict Prohibitions */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 2. Packaging Integrity & Prohibitions
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              Every member listing a medicine must ensure and declare that:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-[#27272a] space-y-1.5 font-mono">
              <li>The medicine remains sealed in its original, tamper-evident blister pack or manufacturer container.</li>
              <li>The expiration date has a minimum 90-day buffer remaining from the date of listing.</li>
              <li>The medication has been stored according to manufacturer label guidelines (dry place below 25°C).</li>
              <li>
                <strong className="text-[#b91c1c]">Strictly Prohibited:</strong> Opened bottles, loose strips, punctured blister foils, expired items, narcotics, Schedule X drugs, and temperature-critical biologics (e.g., Insulin).
              </li>
            </ul>
          </section>

          {/* Section 3: Prescription Requirement */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 3. Prescription Verification (Schedule H / H1)
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              Medicines categorized as prescription-only (Rx) require a verified doctor prescription uploaded by the recipient and approved by a platform coordinator prior to checkout completion. Self-medication of regulated substances is strictly prohibited.
            </p>
          </section>

          {/* Section 4: Physical Inspection & Handover */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 4. In-Person Physical Handover & Inspection
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              Recipients and donor sellers must physically inspect packaging, batch numbers, and expiry stamps during physical handover. If any seal damage is identified, either party may cancel the transaction with full inventory restoration.
            </p>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t-2 border-[#27272a] flex items-center justify-between text-xs font-mono text-[#52525b]">
            <span>MEDISAVE Protocol • PICT Pune</span>
            <Link to="/" className="text-[#166534] font-bold uppercase hover:underline">
              Return to Ledger &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
