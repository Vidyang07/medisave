import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, ArrowRightIcon } from "./common/Icons";

const QUICK_TAGS = [
  { label: "Dolo 650", query: "Dolo 650" },
  { label: "Paracetamol", query: "Paracetamol" },
  { label: "Azee 500 (Antibiotic)", query: "Azee 500" },
  { label: "Limcee (Vitamin C)", query: "Limcee" },
  { label: "Glycomet (Diabetes)", query: "Glycomet" },
  { label: "Telma 40 (BP)", query: "Telma 40" },
  { label: "Katraj Listings", query: "Katraj" },
  { label: "Kothrud Listings", query: "Kothrud" },
];

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/buy?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/buy");
    }
  };

  const handleTagClick = (query) => {
    navigate(`/buy?search=${encodeURIComponent(query)}`);
  };

  return (
    <section className="bg-white border-b-2 border-[#27272a] py-5 sm:py-7 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-[#f8f7f4] border-2 border-[#27272a]">
            <div className="flex items-center flex-1 px-2.5 gap-2">
              <SearchIcon className="w-4 h-4 text-[#71737c] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by brand (e.g. Dolo 650), active salt (Paracetamol), or Pune area..."
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-[#141416] placeholder-[#71737c] focus:outline-none py-1.5"
              />
            </div>
            <button
              type="submit"
              className="bg-[#166534] hover:bg-[#14532d] active:bg-[#052e16] text-white text-xs sm:text-sm font-mono font-bold px-4 py-2 border border-[#166534] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Search Price Sheet
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap text-xs font-mono">
          <span className="font-bold text-[#52525b] shrink-0 text-[11px] uppercase">Index tags:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.label}
              onClick={() => handleTagClick(tag.query)}
              className="bg-[#f0eee7] hover:bg-[#e4e2d8] text-[#141416] px-2 py-0.5 transition text-[11px] font-mono cursor-pointer border border-[#d4d4d8] hover:border-[#27272a]"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}