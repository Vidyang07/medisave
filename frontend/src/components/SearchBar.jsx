import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, ArrowRightIcon } from "./common/Icons";

const QUICK_TAGS = [
  "Paracetamol",
  "Dolo 650",
  "Antibiotics",
  "Vitamin C",
  "Allergy & Cold",
  "Blood Pressure",
  "Pain Relief",
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

  const handleTagClick = (tag) => {
    navigate(`/buy?search=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="bg-white border-b border-[#e4e2dd] py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-[#f7f7f4] border border-[#e4e2dd] rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-[#0f4c42] focus-within:border-[#0f4c42] focus-within:bg-white transition-all">
            <div className="flex items-center flex-1 px-3 gap-2.5">
              <SearchIcon className="w-4 h-4 text-[#737373] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by medicine name, generic formula (e.g. Paracetamol), or company..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#171717] placeholder-[#737373] focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0f4c42] hover:bg-[#0a362f] active:bg-[#072621] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              Search Medicines
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 mt-3.5 flex-wrap text-xs">
          <span className="font-semibold text-[#737373] shrink-0">Popular:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="bg-[#f2f1ec] hover:bg-[#e8f3f1] hover:text-[#0f4c42] text-[#525252] px-2.5 py-1 rounded-md transition text-xs font-medium cursor-pointer border border-[#e4e2dd] hover:border-[#c4ded9]"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}