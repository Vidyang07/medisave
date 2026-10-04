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
    <section className="bg-white border-b border-line py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-canvas border border-line rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-brand focus-within:border-brand focus-within:bg-white transition-all">
            <div className="flex items-center flex-1 px-3 gap-2.5">
              <SearchIcon className="w-4 h-4 text-ink-subtle shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by medicine name, generic formula (e.g. Paracetamol), or company..."
                className="w-full bg-transparent text-xs sm:text-sm text-ink placeholder-ink-subtle focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              className="bg-brand hover:bg-brand-strong active:bg-[#072621] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              Search Medicines
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 mt-3.5 flex-wrap text-xs">
          <span className="font-semibold text-ink-subtle shrink-0">Popular:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="bg-sunken hover:bg-brand-tint hover:text-brand text-ink-muted px-2.5 py-1 rounded-md transition text-xs font-medium cursor-pointer border border-line hover:border-brand-line"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}