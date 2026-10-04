import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  MapPinIcon,
  ExternalLinkIcon,
  AwardIcon,
  ClockIcon,
  HeartIcon,
  UploadIcon,
} from "../components/common/Icons";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CepProofs() {
  const [proofData, setProofData] = useState(null);
  const [activeTab, setActiveTab] = useState("logbook");
  const [customPhotos, setCustomPhotos] = useState([]);
  const [customDriveUrl, setCustomDriveUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProofs() {
      try {
        const res = await axios.get(`${API_BASE}/cep-proofs`);
        if (res.data?.success) {
          setProofData(res.data.data);
        }
      } catch (err) {
        console.warn("Could not fetch remote CEP proof data.", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProofs();
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomPhotos((prev) => [
          ...prev,
          {
            id: `custom-${Date.now()}-${Math.random()}`,
            name: file.name,
            url: reader.result,
            timestamp: new Date().toLocaleString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  if (loading && !proofData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0f4c42] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#525252]">Loading CEP Logbook & Academic Guidelines...</p>
        </div>
      </div>
    );
  }

  const team = proofData?.teamMembers || [];
  const logbookWeeks = proofData?.logbookWeeks || [];

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#171717] pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f4c42] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0a362f]">
        <div className="max-w-7xl mx-auto text-left">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b5e52] text-[#a7f3d0] text-xs font-semibold uppercase tracking-wider mb-3">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                PICT Community Engagement Project (CEP) · Course 0313201
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                CEP Logbook & Activity Documentation Hub
              </h1>
              <p className="mt-2 text-sm text-[#d1fae5] max-w-3xl leading-relaxed">
                Academic tracking dashboard for PICT SY B.Tech Computer Engineering. Contains the 14-week schedule (Page 4), UN SDG alignment (Pages 3 & 6), and guidelines for attaching Geo-tagged photos (Annexure F) and video links (Annexure G).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0f4c42] hover:bg-[#f2f1ec] text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                <AwardIcon className="w-4 h-4" />
                Print / Export 14-Week Logbook
              </button>
            </div>
          </div>

          {/* Academic Meta Strip */}
          <div className="mt-6 pt-6 border-t border-[#1b5e52] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#a7f3d0] block text-[11px] font-semibold uppercase">Institution</span>
              <span className="font-bold text-white">PICT, Pune-411043</span>
            </div>
            <div>
              <span className="text-[#a7f3d0] block text-[11px] font-semibold uppercase">Department</span>
              <span className="font-bold text-white">Computer Engineering</span>
            </div>
            <div>
              <span className="text-[#a7f3d0] block text-[11px] font-semibold uppercase">Academic Term</span>
              <span className="font-bold text-white">AY 2026-27 · Semester III</span>
            </div>
            <div>
              <span className="text-[#a7f3d0] block text-[11px] font-semibold uppercase">Batch & Group</span>
              <span className="font-bold text-white">SY 2 · Batch H2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[#e4e2dd] pb-3 mb-6">
          <button
            onClick={() => setActiveTab("logbook")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "logbook"
                ? "bg-[#0f4c42] text-white shadow-2xs"
                : "bg-white text-[#525252] hover:bg-[#e8f3f1] hover:text-[#0f4c42] border border-[#e4e2dd]"
            }`}
          >
            📅 14-Week Activity Schedule (Page 4)
          </button>
          <button
            onClick={() => setActiveTab("geo-photos")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "geo-photos"
                ? "bg-[#0f4c42] text-white shadow-2xs"
                : "bg-white text-[#525252] hover:bg-[#e8f3f1] hover:text-[#0f4c42] border border-[#e4e2dd]"
            }`}
          >
            📸 Geo-Tagged Photos Checklist (Annexure F)
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "videos"
                ? "bg-[#0f4c42] text-white shadow-2xs"
                : "bg-white text-[#525252] hover:bg-[#e8f3f1] hover:text-[#0f4c42] border border-[#e4e2dd]"
            }`}
          >
            🎥 Video Proof Guidelines (Annexure G)
          </button>
          <button
            onClick={() => setActiveTab("sdg-matrix")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "sdg-matrix"
                ? "bg-[#0f4c42] text-white shadow-2xs"
                : "bg-white text-[#525252] hover:bg-[#e8f3f1] hover:text-[#0f4c42] border border-[#e4e2dd]"
            }`}
          >
            🌱 UN SDG Alignment (Pages 3 & 6)
          </button>
        </div>

        {/* Tab 1: 14-Week Activity Log */}
        {activeTab === "logbook" && (
          <div className="space-y-6 text-left">
            <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs">
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-[#0f4c42]" />
                Page 4: 14-Week Activity Schedule & Verification Record
              </h2>
              <p className="text-xs text-[#525252] mt-1">
                Total hours mapped: 44 Hours · Balanced across problem identification, student community surveys, software engineering, and safe disposal awareness.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#e4e2dd] shadow-2xs overflow-hidden">
              <table className="min-w-full divide-y divide-[#e4e2dd] text-xs">
                <thead className="bg-[#f2f1ec] text-[#171717] font-bold">
                  <tr>
                    <th className="py-3 px-4 text-left w-20">Week</th>
                    <th className="py-3 px-4 text-left w-20">Hours</th>
                    <th className="py-3 px-4 text-left">Task Carried Out & Milestones</th>
                    <th className="py-3 px-4 text-center w-28">Requirement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e2dd]">
                  {logbookWeeks.map((entry) => (
                    <tr key={entry.week} className="hover:bg-[#fafaf7]">
                      <td className="py-2.5 px-4 font-bold text-[#0f4c42]">Week {entry.week}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#525252]">{entry.hours} hrs</td>
                      <td className="py-2.5 px-4 text-[#262626]">{entry.task}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0f4c42] bg-[#e8f3f1] px-2 py-0.5 rounded-full">
                          Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Team Roster */}
            <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-3">
                Student Team Members (PICT SY B.Tech Batch H2)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {team.map((member, idx) => (
                  <div key={idx} className="p-3 bg-[#fafaf7] rounded-lg border border-[#e4e2dd] text-xs">
                    <p className="font-bold text-[#171717]">{member.name}</p>
                    <p className="text-[11px] text-[#0f4c42] font-semibold">Roll No: {member.rollNo}</p>
                    <p className="text-[10px] text-[#737373] font-mono">PRN: {member.prn}</p>
                    <p className="text-[10px] text-[#525252] mt-1">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Geo-Tagged Photos Checklist */}
        {activeTab === "geo-photos" && (
          <div className="space-y-6 text-left">
            <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs">
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[#0f4c42]" />
                Annexure F: Geo-Tagged Photo Requirements & Upload
              </h2>
              <p className="text-xs text-[#525252] mt-1">
                According to the PICT logbook (Page 15), attach real photographs showing the team conducting the activity with location coordinates, timestamp, and names listed below each photo.
              </p>
            </div>

            {/* Instructions Card for Easy Campus Execution */}
            <div className="bg-[#f0f9f8] p-5 rounded-xl border border-[#c4ded9] text-xs text-[#0a362f] space-y-2">
              <p className="font-bold text-sm text-[#0f4c42]">📸 How to take your 3–4 required photos on campus:</p>
              <ul className="list-disc list-inside space-y-1 text-[#262626]">
                <li>Download <strong>GPS Map Camera</strong> (free app on Play Store / App Store).</li>
                <li><strong>Photo 1 (Team Briefing)</strong>: Take a photo of your 4 team members with college ID cards in the computer department or library discussing the project.</li>
                <li><strong>Photo 2 (Campus Survey)</strong>: Take a photo showing the MEDISAVE app on a laptop to 2–3 classmates / hostel mates.</li>
                <li><strong>Photo 3 (Demonstration)</strong>: Take a photo demonstrating the 90-day expiry check and safe disposal guide.</li>
              </ul>
            </div>

            {/* Photo Uploader / Preview */}
            <div className="bg-white p-6 rounded-xl border border-dashed border-[#c4ded9] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center mx-auto">
                <UploadIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#171717]">Upload Your Real Geo-Tagged Photos</p>
                <p className="text-xs text-[#737373] mt-0.5">Select photos taken on campus with GPS Camera to preview them here for your report.</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-[#525252] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0f4c42] file:text-white hover:file:bg-[#0a362f] cursor-pointer"
              />
            </div>

            {customPhotos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {customPhotos.map((photo) => (
                  <div key={photo.id} className="bg-white p-3 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-2">
                    <img src={photo.url} alt={photo.name} className="w-full h-40 object-cover rounded-lg" />
                    <p className="text-xs font-bold text-[#171717] truncate">{photo.name}</p>
                    <p className="text-[10px] text-[#737373]">{photo.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Video Proof Guidelines */}
        {activeTab === "videos" && (
          <div className="space-y-6 text-left">
            <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs">
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#0f4c42]" />
                Annexure G: Video Proof Guidelines (Google Drive)
              </h2>
              <p className="text-xs text-[#525252] mt-1">
                According to Page 15: <em>"Students will keep video links on their Google Drive and paste sharable links here."</em>
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#171717]">Quick 60–90 Second Campus Video Script:</h3>
              <ol className="list-decimal list-inside text-xs text-[#525252] space-y-2">
                <li><strong>Introduction (15s)</strong>: State your names, Roll numbers (21270, 21282, 21269, 21271), Batch H2, and CEP objective.</li>
                <li><strong>Student Survey / Problem (30s)</strong>: Ask a classmate: <em>"How often do you leave unexpired medicines in your room after recovery?"</em></li>
                <li><strong>Solution Demo (30s)</strong>: Show the MEDISAVE interface on laptop / phone explaining 100% free donation and the 90-day safety filter.</li>
              </ol>

              <div className="pt-4 border-t border-[#e4e2dd] space-y-2">
                <label className="block text-xs font-bold text-[#171717]">
                  Your Google Drive Video Sharable Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/YOUR_VIDEO_ID/view?usp=sharing"
                    value={customDriveUrl}
                    onChange={(e) => setCustomDriveUrl(e.target.value)}
                    className="flex-1 bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3 py-2 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                  />
                  {customDriveUrl && (
                    <a
                      href={customDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#0f4c42] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                      Test Link
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-[#737373]">
                  Make sure file permission is set to <strong>"Anyone with the link can view"</strong> before pasting.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SDG Alignment */}
        {activeTab === "sdg-matrix" && (
          <div className="space-y-6 text-left">
            <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs">
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <HeartIcon className="w-5 h-5 text-[#be123c]" />
                UN Sustainable Development Goals (SDG) Alignment (Pages 3 & 6)
              </h2>
              <p className="text-xs text-[#525252] mt-1">
                Direct alignment with SPPU / PICT CEP course outcomes CO1, CO2, and CO3.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase bg-[#e8f3f1] text-[#0f4c42] px-2.5 py-1 rounded-full">
                  SDG Target 3.8
                </span>
                <h3 className="text-sm font-bold text-[#171717]">UN SDG 3: Good Health and Well-being</h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Ensure access to affordable, quality essential medicines and reduce financial burdens of basic healthcare through verified peer exchange and free donation.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e4e2dd] shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase bg-[#e8f3f1] text-[#0f4c42] px-2.5 py-1 rounded-full">
                  SDG Target 12.5
                </span>
                <h3 className="text-sm font-bold text-[#171717]">UN SDG 12: Responsible Consumption & Production</h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  Substantially reduce chemical pharmaceutical waste in municipal drains and Pune river basins by promoting responsible surplus redistribution and safe neutralization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
