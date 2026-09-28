import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/common/Breadcrumb";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Privacy Policy" },
          ]}
        />

        <div className="bg-white rounded-none border-2 border-[#27272a] p-6 sm:p-10 text-left mt-4 space-y-8">
          {/* Header */}
          <div className="border-b-2 border-[#27272a] pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[#b91c1c] tracking-widest uppercase">
                [SECURITY-PROTOCOL]
              </span>
              <span className="stamp-box text-[10px] font-mono uppercase">
                CONFIDENTIAL-RX
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight uppercase">
              Prescription Privacy & Security
            </h1>
            <p className="text-xs sm:text-sm text-[#52525b] font-mono mt-2">
              Revision: September 2026. Private stream protocol for uploaded clinical records.
            </p>
          </div>

          {/* Section 1: Data We Collect */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 1. Minimal Data Collection Ledger
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              To facilitate community medicine exchange, MEDISAVE collects only essential information:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-[#27272a] space-y-1.5 font-mono">
              <li>Account details: name, email address, contact phone, and Pune neighborhood locality.</li>
              <li>Medicine listing data: brand name, salt name, strength, batch number, and packaging images.</li>
              <li>Order handover details: delivery contact and pickup station.</li>
              <li>Prescription verification documents: uploaded doctor prescriptions for Schedule H medicines.</li>
            </ul>
          </section>

          {/* Section 2: Prescription Privacy & Access Controls */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold font-mono text-[#18181b] uppercase tracking-wider">
              § 2. Prescription Stream Access Controls
            </h2>
            <p className="text-xs sm:text-sm text-[#27272a] leading-relaxed">
              Medical prescriptions are sensitive personal documents. MEDISAVE enforces isolated streaming:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-[#27272a] space-y-1.5 font-mono">
              <li>Prescription documents are stored in private, unexposed server directories and are never served via public static URLs.</li>
              <li>Only the authenticated owner who uploaded the prescription and authorized platform coordinators reviewing the verification request may access the document stream.</li>
              <li>Other platform sellers, buyers, or third parties cannot view or download your uploaded prescription files.</li>
            </ul>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t-2 border-[#27272a] flex items-center justify-between text-xs font-mono text-[#52525b]">
            <span>MEDISAVE Security • PICT Pune</span>
            <Link to="/" className="text-[#166534] font-bold uppercase hover:underline">
              Return to Ledger &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
