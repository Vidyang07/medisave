import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  HeartIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "../components/common/Icons";
import { useToast } from "../context/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NgoRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedLocality, setSelectedLocality] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [loading, setLoading] = useState(true);
  const [fulfillingReq, setFulfillingReq] = useState(null);
  const [donationQuantity, setDonationQuantity] = useState(10);
  const [donorNotes, setDonorNotes] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let url = `${API_BASE}/ngo-requests`;
    const params = {};
    if (selectedLocality !== "All") params.locality = selectedLocality;
    if (selectedUrgency !== "All") params.urgency = selectedUrgency;

    axios
      .get(url, { params })
      .then((res) => {
        if (isMounted && res.data?.success) {
          setRequests(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote NGO requests, using fallback.", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocality, selectedUrgency]);

  const refreshRequests = async () => {
    try {
      let url = `${API_BASE}/ngo-requests`;
      const params = {};
      if (selectedLocality !== "All") params.locality = selectedLocality;
      if (selectedUrgency !== "All") params.urgency = selectedUrgency;

      const res = await axios.get(url, { params });
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch remote NGO requests, using fallback.", err);
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!fulfillingReq) return;

    try {
      const res = await axios.post(`${API_BASE}/ngo-requests/${fulfillingReq.id}/fulfill`, {
        quantityDonated: Number(donationQuantity),
        donorNotes,
      });

      if (res.data?.success) {
        addToast({
          type: "success",
          message: `Thank you! ${donationQuantity} units pledged for ${fulfillingReq.organizationName}.`,
        });
        setFulfillingReq(null);
        setDonationQuantity(10);
        setDonorNotes("");
        refreshRequests();
      }
    } catch (err) {
      console.error("Donation fulfillment error:", err);
      addToast({
        type: "error",
        message: "Failed to record donation. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#171717] pb-16">
      {/* Top Banner */}
      <div className="bg-[#0f4c42] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0a362f]">
        <div className="max-w-7xl mx-auto text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b5e52] text-[#a7f3d0] text-xs font-semibold uppercase tracking-wider mb-3">
            <HeartIcon className="w-3.5 h-3.5 text-[#f43f5e]" />
            Community Healthcare Outreach · Pune Region
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            NGO & Campus Health Medicine Wishlists
          </h1>
          <p className="mt-2 text-sm text-[#d1fae5] max-w-3xl leading-relaxed">
            Verified local old age homes, student health centers, and community dispensaries in Katraj, Dhankawadi, and Bibvewadi post specific urgent medicine requirements. Donate your sealed surplus stock directly where it is most needed.
          </p>
          <div className="mt-3 inline-block bg-[#164e63] border border-[#0891b2] text-[#cffafe] px-3 py-1 rounded-md text-xs">
            ⚠️ <strong>DEMO DATA — NOT A REAL NGO PARTNERSHIP:</strong> Illustrative campus pilot requirements for CEP academic evaluation.
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#a7f3d0] text-[#0a362f] hover:bg-[#6ee7b7] text-xs font-bold rounded-lg transition shadow-sm"
            >
              <PackageIcon className="w-4 h-4" />
              Donate Surplus Medicines (100% Free)
            </Link>
            <Link
              to="/cep-proofs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b5e52] text-white hover:bg-[#154a41] text-xs font-bold rounded-lg transition border border-[#2d7d70]"
            >
              <ShieldCheckIcon className="w-4 h-4 text-[#a7f3d0]" />
              View CEP Field Verification & Proofs
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-left">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e4e2dd] shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#737373] block mb-1">Locality Filter</label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="text-xs bg-[#f2f1ec] border border-[#e4e2dd] rounded-lg px-3 py-1.5 font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              >
                <option value="All">All Pune Localities</option>
                <option value="Katraj">Katraj / Ambegaon</option>
                <option value="Dhankawadi">Dhankawadi</option>
                <option value="Bibvewadi">Bibvewadi</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#737373] block mb-1">Urgency Level</label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="text-xs bg-[#f2f1ec] border border-[#e4e2dd] rounded-lg px-3 py-1.5 font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              >
                <option value="All">All Urgencies</option>
                <option value="Urgent">🔴 Urgent</option>
                <option value="Moderate">🟡 Moderate</option>
                <option value="Routine">🟢 Routine</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#525252]">
            Showing <span className="font-bold text-[#171717]">{requests.length}</span> active organization requests
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#737373]">Loading NGO requirements...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#e4e2dd] text-center">
            <p className="text-sm font-bold text-[#171717]">No requests matching the selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => {
              const progressPct = Math.min(100, Math.round((req.fulfilledDoses / req.requiredDoses) * 100));
              const isFullyFulfilled = req.fulfilledDoses >= req.requiredDoses;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-[#e4e2dd] shadow-2xs p-6 flex flex-col justify-between hover:border-[#0f4c42] transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            req.urgency === "Urgent"
                              ? "bg-[#ffe4e6] text-[#be123c]"
                              : req.urgency === "Moderate"
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#e8f3f1] text-[#0f4c42]"
                          }`}
                        >
                          {req.urgency} Requirement
                        </span>
                        <h2 className="text-base font-bold text-[#171717] mt-2">{req.organizationName}</h2>
                        <p className="text-xs text-[#525252] flex items-center gap-1 mt-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                          {req.address}
                        </p>
                      </div>
                    </div>

                    {/* Medicine Needed Card */}
                    <div className="mt-4 p-3.5 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]">
                      <span className="text-[10px] uppercase font-bold text-[#737373] block">Target Medicine Needed:</span>
                      <p className="text-sm font-extrabold text-[#0f4c42] mt-0.5">{req.requiredMedicine}</p>
                      <p className="text-xs text-[#525252] mt-1 font-medium">Category: {req.category}</p>
                      <p className="text-xs text-[#525252] mt-1">
                        <span className="font-semibold text-[#171717]">Beneficiaries:</span> {req.targetBeneficiaries}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#525252]">Fulfillment Progress:</span>
                        <span className="text-[#0f4c42]">{req.fulfilledDoses} / {req.requiredDoses} Doses ({progressPct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#e4e2dd] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0f4c42] rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-[#737373]">
                      <span className="font-semibold">Quality Criteria:</span> {req.notes}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#e4e2dd] flex items-center justify-between gap-3">
                    <div className="text-[11px] text-[#525252]">
                      <span className="block font-semibold text-[#171717]">Contact: {req.contactPerson}</span>
                      <span>{req.contactPhone}</span>
                    </div>

                    <button
                      onClick={() => setFulfillingReq(req)}
                      disabled={isFullyFulfilled}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isFullyFulfilled
                          ? "bg-[#e4e2dd] text-[#737373] cursor-not-allowed"
                          : "bg-[#0f4c42] text-white hover:bg-[#0a362f]"
                      }`}
                    >
                      <HeartIcon className="w-3.5 h-3.5 text-[#a7f3d0]" />
                      {isFullyFulfilled ? "Target Met" : "Fulfill with Surplus"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fulfillment Modal */}
      {fulfillingReq && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#e4e2dd] pb-3">
              <h3 className="text-base font-bold text-[#171717]">Pledge Surplus Donation</h3>
              <button
                onClick={() => setFulfillingReq(null)}
                className="text-[#737373] hover:text-[#171717] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-3 bg-[#e8f3f1] rounded-lg text-xs text-[#0f4c42]">
              <p className="font-bold">Organization: {fulfillingReq.organizationName}</p>
              <p className="mt-0.5">Medicine: {fulfillingReq.requiredMedicine}</p>
              <p className="text-[11px] text-[#0a362f] mt-1">Handover Location: {fulfillingReq.address}</p>
            </div>

            <form onSubmit={handleFulfillSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Quantity / Doses to Donate (Tablets/Units)
                </label>
                <input
                  type="number"
                  min="1"
                  max={fulfillingReq.requiredDoses - fulfillingReq.fulfilledDoses + 20}
                  value={donationQuantity}
                  onChange={(e) => setDonationQuantity(e.target.value)}
                  className="w-full bg-[#f2f1ec] border border-[#e4e2dd] rounded-lg px-3 py-2 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Donor Notes & Expiry Verification
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g., 1 sealed strip of 10 tablets with expiry 05/2027. Stored in dry conditions."
                  value={donorNotes}
                  onChange={(e) => setDonorNotes(e.target.value)}
                  className="w-full bg-[#f2f1ec] border border-[#e4e2dd] rounded-lg px-3 py-2 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFulfillingReq(null)}
                  className="flex-1 py-2 bg-[#f2f1ec] text-[#262626] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#e4e2dd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0f4c42] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#0a362f] shadow-sm"
                >
                  Confirm Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
