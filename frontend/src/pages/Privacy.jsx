import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { AlertCircleIcon } from "../components/common/Icons";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Privacy Policy" },
          ]}
        />

        <div className="bg-white rounded-xl border border-line p-6 sm:p-10 text-left mt-4 space-y-8">
          {/* Header */}
          <div className="border-b border-line pb-6">
            <div className="inline-flex items-center gap-2 bg-warning-tint text-warning border border-warning-line px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-3">
              <AlertCircleIcon className="w-4 h-4" />
              <span>Draft for Review • Data Protection Principles</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Privacy & Document Security Policy
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-2">
              Last updated: September 2026. How MEDISAVE protects your personal data and health records.
            </p>
          </div>

          {/* Section 1: Data We Collect */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              1. Information Collected
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              To facilitate community medicine exchange, MEDISAVE collects only essential information:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-ink-muted space-y-1.5">
              <li>Account details: name, email address, phone number, and city/locality.</li>
              <li>Medicine listing data: brand name, salt name, strength, batch number, and packaging images.</li>
              <li>Order handover details: delivery contact and pickup address.</li>
              <li>Prescription verification documents: uploaded PDF/JPEG/PNG doctor prescriptions.</li>
            </ul>
          </section>

          {/* Section 2: Prescription Privacy & Access Controls */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              2. Prescription Confidentiality & Document Security
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Medical prescriptions are sensitive personal documents. MEDISAVE implements strict privacy controls:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-ink-muted space-y-1.5">
              <li>Prescription documents are stored in private, unexposed server directories and are never served via public static URLs.</li>
              <li>Only the authenticated owner who uploaded the prescription and authorized platform coordinators reviewing the verification request may access the document stream.</li>
              <li>Other platform members, recipients, or third parties cannot view or download your uploaded prescription files.</li>
            </ul>
          </section>

          {/* Section 3: Data Retention & Security */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              3. Data Retention and Safeguards
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Authentication credentials are encrypted using industry-standard salted hashing (bcrypt). Session tokens use JSON Web Tokens (JWT) with restricted lifespans. We do not sell, rent, or trade your personal information with external advertisers.
            </p>
          </section>

          {/* Section 4: Your Rights */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink">
              4. User Control & Data Rights
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              You can review, update, or remove your medicine listings and view your order history directly from your account dashboard. For data deletion inquiries, contact our project maintainers at support@medisave.org.
            </p>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t border-line flex items-center justify-between text-xs text-ink-subtle">
            <span>MEDISAVE Project • Pune Community Health Initiative</span>
            <Link to="/" className="text-brand font-semibold hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
