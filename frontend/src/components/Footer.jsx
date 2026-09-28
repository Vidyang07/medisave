import { Link } from "react-router-dom";
import { PillIcon, ShieldCheckIcon, MailIcon, MapPinIcon } from "./common/Icons";

export default function Footer() {
  return (
    <footer className="bg-[#171717] text-[#d4d4d4] border-t border-[#262626] text-xs sm:text-sm text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0f4c42] text-[#a7f3d0] flex items-center justify-center">
                <PillIcon className="w-3.5 h-3.5 transform -rotate-45" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                MEDI<span className="text-[#a7f3d0]">SAVE</span>
              </span>
            </Link>
            <p className="text-[#a3a3a3] text-xs leading-relaxed max-w-sm">
              A community initiative connecting individuals with surplus,
              unexpired, and verified sealed medicines to make essential healthcare accessible and reduce pharmaceutical waste.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#a7f3d0] font-medium pt-1">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>College Community Health Engagement Initiative</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Marketplace
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li>
                <Link to="/buy" className="hover:text-white transition">
                  Browse Medicines
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-white transition">
                  List Unused Medicine
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
                <Link to="/buy?category=Vitamins+%26+Supplements" className="hover:text-white transition">
                  Vitamins & Supplements
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Account Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Account & Portal
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Member Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Profile & Settings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition">
                  Join Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Initiative Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Initiative Info
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li className="flex items-center gap-2">
                <MapPinIcon className="w-3.5 h-3.5 text-[#a7f3d0] shrink-0" />
                <span>Pune, Maharashtra, India</span>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="w-3.5 h-3.5 text-[#a7f3d0] shrink-0" />
                <span>support@medisave.org</span>
              </li>
              <li className="pt-1 text-[11px] text-[#737373]">
                Operating under Community Verification Guidelines.
              </li>
            </ul>
          </div>
        </div>

        {/* Academic & Regulatory Safety Disclaimer */}
        <div className="mt-10 pt-5 border-t border-[#262626] text-[11px] text-[#737373] leading-relaxed space-y-3">
          <p>
            <strong className="text-[#a3a3a3]">Academic Project Disclaimer:</strong> MEDISAVE is a student engagement initiative developed for community health awareness and responsible medicine disposal research. It does not replace medical advice from licensed physicians or registered pharmacists. Always consult a qualified medical professional before taking any medication.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[#737373] text-[11px] pt-3 border-t border-[#262626] gap-2">
            <div>
              © 2026 MEDISAVE Project. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-white transition">
                Terms of Service
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