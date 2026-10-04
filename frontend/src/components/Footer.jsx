import { Link } from "react-router-dom";
import { PillIcon, ShieldCheckIcon, MapPinIcon } from "./common/Icons";

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
              Community Medicine Donation & Expiry Awareness Platform. Connecting individuals holding surplus, unexpired, sealed medicines with verified community healthcare partners.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#a7f3d0] font-medium pt-1">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>Verified Non-Profit Healthcare Redistribution</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li>
                <Link to="/buy" className="hover:text-white transition">
                  Browse Donations
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-white transition">
                  Donate Medicine
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  My Medicine Cabinet
                </Link>
              </li>
              <li>
                <Link to="/disposal-guide" className="hover:text-white transition">
                  Safe Disposal Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Portals */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Portals
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Donor Hub
                </Link>
              </li>
              <li>
                <Link to="/partner" className="hover:text-white transition">
                  Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition">
                  Coordinator Queue
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Awareness & Safety */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Safety & Standards
            </h4>
            <ul className="space-y-1.5 text-xs text-[#a3a3a3]">
              <li>
                <Link to="/disposal-guide" className="hover:text-white transition">
                  Household Neutralization
                </Link>
              </li>
              <li>
                <Link to="/disposal-guide#amr-prevention" className="hover:text-white transition">
                  AMR Prevention
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Donation Standards
                </Link>
              </li>
              <li className="flex items-center gap-2 pt-1 text-[#737373]">
                <MapPinIcon className="w-3.5 h-3.5 text-[#a7f3d0] shrink-0" />
                <span>Pune Community Network</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory & Safety Disclaimer */}
        <div className="mt-10 pt-5 border-t border-[#262626] text-[11px] text-[#737373] leading-relaxed space-y-3">
          <p>
            <strong className="text-[#a3a3a3]">Healthcare Notice:</strong> MEDISAVE is a community medicine donation and expiry awareness platform. It facilitates the non-profit redistribution of eligible unused medicines through verified healthcare partners and promotes responsible disposal of expired drugs. Always consult a licensed medical practitioner or registered pharmacist for medical advice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[#737373] text-[11px] pt-3 border-t border-[#262626] gap-2">
            <div>
              © 2026 MEDISAVE Platform. All rights reserved.
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