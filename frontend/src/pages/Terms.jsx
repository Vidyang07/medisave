import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { AlertCircleIcon } from "../components/common/Icons";

export default function Terms() {
  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Terms of Service" },
          ]}
        />

        <div className="bg-white rounded-xl border border-line p-6 sm:p-10 text-left mt-4 space-y-8">
          {/* Header */}
          <div className="border-b border-line pb-6">
            <div className="inline-flex items-center gap-2 bg-warning-tint text-warning border border-warning-line px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-3">
              <AlertCircleIcon className="w-4 h-4" />
              <span>Draft for Review • Academic Project Prototype</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Community Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-2">
              Last updated: September 2026. These terms govern participation in the MEDISAVE peer medicine exchange platform.
            </p>
          </div>

          {/* Section 1: Nature of Platform */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              1. Purpose and Non-Commercial Nature
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              MEDISAVE is an academic community initiative designed for research on reducing unused medicine waste and improving localized access to surplus, unexpired medicines. MEDISAVE is not a commercial pharmacy, licensed drug manufacturer, or medical distributor.
            </p>
          </section>

          {/* Section 2: Medicine Eligibility & Strict Prohibitions */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              2. Medicine Listing Standards & Prohibitions
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Every member listing a medicine must ensure and declare that:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-ink-muted space-y-1.5">
              <li>The medicine remains sealed in its original, tamper-evident blister pack or manufacturer container.</li>
              <li>The expiration date has a minimum 90-day buffer remaining from the date of listing.</li>
              <li>The medication has been stored according to manufacturer label guidelines (dry place below 25°C).</li>
              <li>
                <strong>Strictly Prohibited:</strong> Opened bottles, loose strips, punctured blister foils, expired items, narcotics, Schedule X drugs, and temperature-critical biologics (e.g., Insulin).
              </li>
            </ul>
          </section>

          {/* Section 3: Prescription Requirement */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              3. Prescription Verification (Schedule H / H1)
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Medicines categorized as prescription-only (Rx) require a verified doctor prescription uploaded by the recipient and approved by a platform coordinator prior to partner handover completion. Self-medication of regulated substances is strictly discouraged.
            </p>
          </section>

          {/* Section 4: Physical Inspection & Handover */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              4. Community Handover and In-Person Verification
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Recipients and donors must physically inspect packaging, batch numbers, and expiry stamps during physical handover. If any seal damage is identified, either party may cancel the transaction with full inventory restoration.
            </p>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              5. Medical Advice Disclaimer and Limitation of Liability
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              MEDISAVE does not provide medical diagnoses, treatment plans, or pharmaceutical consultations. Always consult a registered physician or healthcare professional before taking any medication.
            </p>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t border-line flex items-center justify-between text-xs text-ink-subtle">
            <span>Questions? Contact support@medisave.org</span>
            <Link to="/" className="text-brand font-semibold hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
