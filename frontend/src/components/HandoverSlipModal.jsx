import { useRef } from "react";
import { XIcon, PrinterIcon, ShieldCheckIcon, MapPinIcon } from "./common/Icons";

export default function HandoverSlipModal({ isOpen, onClose, order }) {
  const docketRef = useRef(null);

  if (!isOpen || !order) return null;

  const orderId = order._id || order.id || "ORD-2026";
  const shortId = orderId.toString().slice(-8).toUpperCase();
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const buyerName = order.buyer?.name || order.shippingAddress?.fullName || "Verified Buyer";
  const buyerPhone = order.shippingAddress?.phone || order.buyer?.phone || "Phone on file";
  const buyerAddress = order.shippingAddress?.address || "Pune Local Handover";
  const buyerCity = order.shippingAddress?.city || "Pune";

  const handoverPoint =
    order.handoverPoint ||
    order.items?.[0]?.handoverPoint ||
    order.items?.[0]?.medicine?.handoverPoint ||
    "Katraj Chowk, near PMT Bus Stop, Pune";

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const subtotal = order.totalAmount || order.total || 0;
  const deliveryFee = order.deliveryFee !== undefined ? order.deliveryFee : 0;
  const grandTotal = subtotal + (deliveryFee || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#fbfaf8] text-[#141416] w-full max-w-2xl border-2 border-[#27272a] shadow-none p-5 sm:p-8 space-y-6 text-left print:p-0 print:border-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-[#d4d4d8]">
          <div className="flex items-center gap-2">
            <span className="stamp-green text-[11px]">VERIFIED HANDOVER DOCKET</span>
            <span className="text-xs font-mono text-[#52525b]">#{shortId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold border border-[#166534] cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#52525b] hover:text-[#141416] hover:bg-[#e4e4e7] border border-[#d4d4d8] cursor-pointer"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Physical Slip Content */}
        <div ref={docketRef} className="print-docket space-y-5">
          {/* Header Block with Rx Warning Bar */}
          <div className="border-b-2 border-[#27272a] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="stamp-rx text-xs font-bold">Rx / CEP</span>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight uppercase font-heading">
                    MEDISAVE DISPENSARY DOCKET
                  </h2>
                </div>
                <p className="text-[11px] font-mono text-[#52525b] mt-0.5">
                  COMMUNITY MEDICINE EXCHANGE & REDISTRIBUTION REGISTRY · PUNE
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-[#27272a]">
                <div><strong>DOCKET NO:</strong> MS-PUN-{shortId}</div>
                <div className="text-[11px] text-[#52525b]">DATE: {dateStr}</div>
              </div>
            </div>
          </div>

          {/* Handover & Participant Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#27272a] p-3 text-xs bg-white">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-[#52525b] block">
                RECIPIENT / BUYER
              </span>
              <div className="font-bold text-[#141416]">{buyerName}</div>
              <div className="text-[#52525b] text-[11px]">Phone: {buyerPhone}</div>
              <div className="text-[#52525b] text-[11px]">{buyerAddress}, {buyerCity}</div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-[#d4d4d8] sm:pl-4">
              <span className="font-mono text-[10px] uppercase font-bold text-[#52525b] block">
                DESIGNATED PUNE HANDOVER POINT
              </span>
              <div className="font-bold text-[#166534] flex items-start gap-1">
                <MapPinIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{handoverPoint}</span>
              </div>
              <div className="text-[11px] text-[#52525b]">
                Coordination: Self-pickup / Campus Volunteer Kiosk
              </div>
            </div>
          </div>

          {/* Itemized Medicine Table */}
          <div className="border border-[#27272a] overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0eee7] border-b border-[#27272a] font-mono text-[10px] text-[#27272a] uppercase">
                  <th className="p-2 border-r border-[#d4d4d8]">Item & Formulation</th>
                  <th className="p-2 border-r border-[#d4d4d8]">Batch & Expiry</th>
                  <th className="p-2 border-r border-[#d4d4d8] text-center">Qty</th>
                  <th className="p-2 border-r border-[#d4d4d8] text-right">Printed MRP</th>
                  <th className="p-2 text-right">Agreed Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4d4d8]">
                {items.length > 0 ? (
                  items.map((item, idx) => {
                    const med = item.medicine || item;
                    const name = med.brandName || med.name || med.medicineName || "Prescription Item";
                    const generic = med.genericName || med.saltComposition || "";
                    const batch = med.batchNumber || "VERIFIED-BATCH";
                    const exp = med.expiryText || (med.expiryDate ? new Date(med.expiryDate).toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" }) : "Unexpired");
                    const mrp = med.originalMrp || item.originalMrp || item.price || 0;
                    const price = item.price !== undefined ? item.price : med.price;
                    const qty = item.quantity || 1;

                    return (
                      <tr key={idx} className="font-mono text-[11px]">
                        <td className="p-2 border-r border-[#d4d4d8]">
                          <div className="font-sans font-bold text-[#141416] text-xs">{name}</div>
                          {generic && <div className="text-[10px] text-[#52525b] font-sans truncate max-w-xs">{generic}</div>}
                        </td>
                        <td className="p-2 border-r border-[#d4d4d8] whitespace-nowrap">
                          <div>BATCH: {batch}</div>
                          <div className="stamp-box text-[9px] mt-0.5">EXP: {exp}</div>
                        </td>
                        <td className="p-2 border-r border-[#d4d4d8] text-center font-bold">
                          {qty}
                        </td>
                        <td className="p-2 border-r border-[#d4d4d8] text-right text-[#71737c] line-through">
                          ₹{mrp}
                        </td>
                        <td className="p-2 text-right font-bold text-[#166534]">
                          ₹{price * qty}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-[#52525b]">
                      No items listed in this order docket.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-[#27272a] bg-[#f8f7f4] font-mono text-xs">
                <tr>
                  <td colSpan="4" className="p-2 text-right font-bold border-r border-[#d4d4d8]">
                    TOTAL COMMUNITY PAYABLE:
                  </td>
                  <td className="p-2 text-right font-bold text-sm text-[#141416]">
                    ₹{grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Physical Verification & Safety Checklist */}
          <div className="border border-[#27272a] p-3 text-xs bg-[#fbfaf8] space-y-2">
            <div className="font-bold text-[11px] text-[#141416] uppercase font-mono flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#166534]" />
              <span>Mandatory Physical Handover Inspection Protocol</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#4b4d52]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="accent-[#166534]" />
                <span>Blister foil cavity sealed without tears</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="accent-[#166534]" />
                <span>Batch and Expiry match packaging stamp</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="accent-[#166534]" />
                <span>Stored below 25°C in clean dry conditions</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="accent-[#166534]" />
                <span>Valid physician prescription verified</span>
              </label>
            </div>
          </div>

          {/* Signature & Acknowledgment Block */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-xs font-mono border-t border-[#d4d4d8]">
            <div className="space-y-6">
              <div className="border-b border-[#27272a] pb-1 text-[#52525b] text-[10px]">
                RECIPIENT SIGNATURE & ACKNOWLEDGMENT
              </div>
              <div className="text-[10px] text-[#71737c]">Date: ____________________</div>
            </div>
            <div className="space-y-6">
              <div className="border-b border-[#27272a] pb-1 text-[#52525b] text-[10px]">
                DONOR / VERIFYING COORDINATOR
              </div>
              <div className="text-[10px] text-[#71737c]">Date: ____________________</div>
            </div>
          </div>

          {/* Academic Footer Disclaimer */}
          <div className="text-[10px] text-[#71737c] font-mono border-t border-[#d4d4d8] pt-2 text-center">
            MEDISAVE · CEP ACADEMIC INITIATIVE · PICT PUNE · NOT FOR COMMERCIAL RE-SALE
          </div>
        </div>
      </div>
    </div>
  );
}
