import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  MapPinIcon,
} from "./common/Icons";
import { Button } from "./common/Button";

export default function Hero() {
  return (
    <section className="bg-[#f8f7f4] border-b-2 border-[#27272a] py-8 sm:py-12 lg:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Utilitarian Community Mission & Locality Match */}
          <div className="lg:col-span-7 space-y-5">
            {/* Stamped Register Label */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="stamp-box text-[11px] text-[#141416]">
                PUNE COMMUNITY PHARMACEUTICAL REGISTER
              </span>
              <span className="stamp-rx text-[11px]">
                Rx & NON-Rx EXCHANGE
              </span>
            </div>

            {/* Sturdy Grotesque Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#141416] font-heading tracking-tight leading-[1.15]">
              Surplus medicines in Pune homes. <br />
              <span className="text-[#166534]">Verified, unexpired, and redistributed locally.</span>
            </h1>

            {/* Direct, Honest Narrative Copy */}
            <p className="text-sm sm:text-base text-[#4b4d52] leading-relaxed max-w-xl">
              MEDISAVE indexes sealed, unexpired medicine strips from households across Katraj, Kothrud, Hinjewadi, and Baner. Instead of discarding surplus medication into municipal waste, community members list intact blister packs for local handover at 40% to 65% below printed MRP.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/buy">
                <Button variant="primary" size="md">
                  Browse Active Pune Listings
                  <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/sell">
                <Button variant="secondary" size="md">
                  List Unused Medicine Strip
                </Button>
              </Link>
            </div>

            {/* Live Pune Pickup Points & Distance Rule */}
            <div className="border border-[#27272a] bg-white p-3.5 space-y-2 mt-4 max-w-xl">
              <div className="flex items-center justify-between text-xs font-mono border-b border-[#d4d4d8] pb-1.5">
                <span className="font-bold text-[#141416] uppercase flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-[#166534]" />
                  Active Pune Handover Hubs
                </span>
                <span className="text-[#52525b] text-[11px]">Calculated via Haversine</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-1.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                  <strong className="block text-[#141416]">Katraj Chowk</strong>
                  <span className="text-[#52525b] text-[10px]">Near PMT Bus Stop</span>
                </div>
                <div className="p-1.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                  <strong className="block text-[#141416]">Kothrud</strong>
                  <span className="text-[#52525b] text-[10px]">Vanaz Metro Gate</span>
                </div>
                <div className="p-1.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                  <strong className="block text-[#141416]">Hinjewadi</strong>
                  <span className="text-[#52525b] text-[10px]">Phase 1 Infosys Circle</span>
                </div>
                <div className="p-1.5 bg-[#f8f7f4] border border-[#d4d4d8]">
                  <strong className="block text-[#141416]">PICT Campus</strong>
                  <span className="text-[#166534] font-bold text-[10px]">Dispensary Kiosk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Blister Strip Inspection Docket */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-[#27272a] p-4 sm:p-5 space-y-4 text-left rx-stripe-top">
              {/* Docket Top Banner */}
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
                <div>
                  <div className="text-[10px] font-mono text-[#52525b] uppercase">REGISTER SPECIMEN</div>
                  <div className="font-heading font-bold text-sm text-[#141416]">DOLO 650 TABLETS IP</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="stamp-green text-[10px]">INSPECTED</span>
                </div>
              </div>

              {/* Blister Card Detail Box */}
              <div className="border border-[#27272a] bg-[#f8f7f4] p-3 space-y-2">
                <div className="flex justify-between items-start text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#52525b] block">GENERIC SALT COMPOSITION</span>
                    <strong className="text-[#141416] font-sans">Paracetamol IP (650mg)</strong>
                  </div>
                  <span className="stamp-box text-[10px]">BATCH #ML-650X82</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#d4d4d8] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[#52525b] block">MANUFACTURER</span>
                    <span className="font-bold text-[#141416]">Micro Labs Ltd.</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#52525b] block">EXPIRY STAMP</span>
                    <span className="font-bold text-[#b91c1c]">AUG 2027 (17 mo)</span>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown Formula Box */}
              <div className="border border-[#27272a] p-3 bg-white space-y-1.5 font-mono text-xs">
                <div className="text-[10px] uppercase font-bold text-[#52525b] border-b border-[#d4d4d8] pb-1">
                  DETERMINISTIC COMMUNITY RATE CALCULATION
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#52525b]">Manufacturer Printed MRP:</span>
                  <span className="line-through text-[#71737c]">₹72.00</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#52525b]">Remaining Shelf Life Multiplier (12+ mo):</span>
                  <span className="text-[#166534] font-bold">-47%</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-[#27272a] text-[#141416]">
                  <span>Community Exchange Rate:</span>
                  <span className="text-base text-[#166534]">₹38.00</span>
                </div>
              </div>

              {/* Handover Note */}
              <div className="text-[11px] font-mono text-[#52525b] flex items-center justify-between pt-1 border-t border-[#d4d4d8]">
                <span>Pickup Point: Kothrud Vanaz Metro</span>
                <span className="font-bold text-[#141416]">2.1 km Nearby</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}