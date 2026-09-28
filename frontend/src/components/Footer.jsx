import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#141416] text-[#d4d4d8] border-t-2 border-[#27272a] text-xs font-mono text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#166534] text-white flex items-center justify-center font-bold text-xs">
                +
              </div>
              <span className="text-base font-bold font-heading tracking-tight text-white">
                MEDI<span className="text-[#22c55e]">SAVE</span>
              </span>
            </Link>
            <p className="text-[#a1a1aa] text-xs font-sans leading-relaxed max-w-sm">
              A community engagement initiative indexing unexpired, sealed surplus medicines across Pune neighborhoods to improve healthcare affordability and prevent pharmaceutical waste.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#22c55e]">
              <span className="stamp-green text-[9px]">PICT CEP PROJECT</span>
              <span>Pune Community Registry</span>
            </div>
          </div>

          {/* Quick Index */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs">
              Price Sheet
            </h4>
            <ul className="space-y-1 text-xs text-[#a1a1aa]">
              <li>
                <Link to="/buy" className="hover:text-white transition">
                  Browse All Listings
                </Link>
              </li>
              <li>
                <Link to="/buy?category=Pain+%26+Fever" className="hover:text-white transition">
                  Pain & Fever
                </Link>
              </li>
              <li>
                <Link to="/buy?category=Antibiotics" className="hover:text-white transition">
                  Antibiotics (Rx)
                </Link>
              </li>
              <li>
                <Link to="/buy?category=Diabetes+Care" className="hover:text-white transition">
                  Diabetes Care
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-white transition">
                  List Unused Medicine
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Portal */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs">
              Portal
            </h4>
            <ul className="space-y-1 text-xs text-[#a1a1aa]">
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Member Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition">
                  Register Donor
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Pune Hubs */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs">
              Pune Exchange Hubs
            </h4>
            <ul className="space-y-1 text-[11px] text-[#a1a1aa]">
              <li>• Katraj Chowk (PMT Depot)</li>
              <li>• Kothrud (Vanaz Metro)</li>
              <li>• Hinjewadi (Phase 1 Circle)</li>
              <li>• Baner (High Street Junction)</li>
              <li>• Swargate (ST Stand Gate)</li>
              <li>• PICT Campus Dispensary</li>
            </ul>
          </div>
        </div>

        {/* Academic & Regulatory Safety Disclaimer */}
        <div className="mt-8 pt-5 border-t border-[#27272a] text-[11px] text-[#71717a] leading-relaxed space-y-2">
          <p>
            <strong className="text-[#a1a1aa]">Academic Research Project:</strong> MEDISAVE is developed for the Community Engagement Program (CEP) by students of Pune Institute of Computer Technology (PICT), Pune. It demonstrates safe peer-to-peer surplus medicine matching and does not operate as a licensed commercial pharmacy or emergency logistics provider.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[#71717a] text-[10px] pt-2 border-t border-[#27272a] gap-2">
            <div>
              © 2026 MEDISAVE · Division SY 2, Batch H2 · PICT Pune
            </div>
            <div className="flex gap-3">
              <Link to="/terms" className="hover:text-white transition">
                Terms of Use
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}