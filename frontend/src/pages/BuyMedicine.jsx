import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import MedicineCard from "../components/MedicineCard";
import { CATEGORIES, DOSAGE_FORMS } from "../data/mockData";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { MedicineCardSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  AlertCircleIcon,
  MapPinIcon,
} from "../components/common/Icons";
import { PUNE_LOCALITIES } from "../utils/localityConstants";

export default function BuyMedicine() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "All Categories";
  const urlLocality = searchParams.get("locality") || "Kothrud";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedForm, setSelectedForm] = useState("All Forms");
  const [maxPrice, setMaxPrice] = useState(250);
  const [rxFilter, setRxFilter] = useState("all"); // 'all', 'otc', 'rx'
  const [sortBy, setSortBy] = useState("nearby");
  const [buyerLocality, setBuyerLocality] = useState(urlLocality);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });
  const [error, setError] = useState(null);

  const itemsPerPage = 9;

  const effectiveSearch = searchQuery.trim() || urlSearch.trim();
  const effectiveCategory =
    selectedCategory !== "All Categories" ? selectedCategory : urlCategory;

  // Fetch medicines from backend API
  useEffect(() => {
    let isMounted = true;

    const params = {
      page: currentPage,
      limit: itemsPerPage,
      sort: sortBy,
      buyerLocality: buyerLocality,
    };

    if (effectiveSearch) {
      params.search = effectiveSearch;
    }
    if (effectiveCategory && effectiveCategory !== "All Categories" && effectiveCategory !== "All") {
      params.category = effectiveCategory;
    }
    if (selectedForm && selectedForm !== "All Forms" && selectedForm !== "All") {
      params.dosageForm = selectedForm;
    }
    if (maxPrice < 250) {
      params.maxPrice = maxPrice;
    }
    if (rxFilter !== "all") {
      params.rxFilter = rxFilter;
    }

    api
      .get("/medicines", { params })
      .then((res) => {
        if (isMounted) {
          if (res.data?.success) {
            setMedicines(res.data.data || []);
            setPagination(
              res.data.pagination || {
                page: currentPage,
                limit: itemsPerPage,
                total: res.data.data?.length || 0,
                pages: 1,
              }
            );
            setError(null);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load medicines from database.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveSearch, effectiveCategory, selectedForm, maxPrice, rxFilter, sortBy, buyerLocality, currentPage]);

  const handleCategoryChange = (cat) => {
    setIsLoading(true);
    setSelectedCategory(cat);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "All Categories") {
        next.delete("category");
      } else {
        next.set("category", cat);
      }
      return next;
    });
  };

  const handleLocalityChange = (locName) => {
    setIsLoading(true);
    setBuyerLocality(locName);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("locality", locName);
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setIsLoading(true);
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedForm("All Forms");
    setMaxPrice(250);
    setRxFilter("all");
    setSortBy("nearby");
    setCurrentPage(1);
    setSearchParams({});
  };

  const activeFilterCount =
    (selectedCategory !== "All Categories" ? 1 : 0) +
    (selectedForm !== "All Forms" ? 1 : 0) +
    (maxPrice < 250 ? 1 : 0) +
    (rxFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#f7f7f4] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Browse Medicines" }]} />

        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e4e2dd] pb-5 text-left">
          <div>
            <span className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider">
              Pune Community Exchange
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight mt-1">
              Find medicines in your community
            </h1>
            <p className="text-xs sm:text-sm text-[#525252] mt-1 max-w-2xl leading-relaxed">
              Browse genuine surplus medications from verified community donors. MEDISAVE prioritizes nearby listings with convenient physical handover points across Pune.
            </p>
          </div>

          {/* Quick Search Field in Header */}
          <div className="w-full md:w-80">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setIsLoading(true);
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search brand, salt, locality, or handover..."
                className="w-full bg-white border border-[#e4e2dd] rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-[#171717] placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:border-[#0f4c42] transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#171717] cursor-pointer"
                  aria-label="Clear search"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BUYER LOCALITY SELECTOR & HANDOVER DISCLAIMER BANNER */}
        <div className="bg-white rounded-xl border border-[#c4ded9] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f4c42] text-white flex items-center justify-center shrink-0">
              <MapPinIcon className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#171717]">
                  Your Location in Pune:
                </span>
                <select
                  value={buyerLocality}
                  onChange={(e) => handleLocalityChange(e.target.value)}
                  className="bg-[#f0f9f8] border border-[#c4ded9] text-[#0f4c42] font-bold text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#0f4c42] cursor-pointer"
                >
                  {PUNE_LOCALITIES.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} (PIN: {loc.pinCode})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-[#525252] mt-0.5">
                MEDISAVE prioritizes nearby community listings and uses mutually agreed handover points instead of operating its own delivery fleet.
              </p>
            </div>
          </div>

          <div className="text-xs text-[#0f4c42] font-medium bg-[#e8f3f1] px-3 py-1.5 rounded-lg border border-[#c4ded9] shrink-0">
            📍 Calculating distances from <strong>{buyerLocality}</strong>
          </div>
        </div>

        {/* Quick Filter Horizontal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs text-left">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#0f4c42] text-white font-semibold shadow-2xs"
                  : "bg-white border border-[#e4e2dd] text-[#525252] hover:bg-[#f2f1ec] hover:text-[#171717]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-Column Marketplace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Desktop Sidebar Filters (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-xl border border-[#e4e2dd] p-4 sm:p-5 shadow-2xs space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae5]">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-[#0f4c42]" />
                <h2 className="text-xs sm:text-sm font-bold text-[#171717]">Filters</h2>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-[#0f4c42] hover:underline font-semibold cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Category Filter List */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Category
              </label>
              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-[#e8f3f1] text-[#0f4c42] font-bold border border-[#c4ded9]"
                        : "text-[#525252] hover:bg-[#f7f7f4] hover:text-[#171717]"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f4c42]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosage Form Filter */}
            <div className="space-y-1.5 pt-3 border-t border-[#eceae5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Dosage Form
              </label>
              <select
                value={selectedForm}
                onChange={(e) => {
                  setIsLoading(true);
                  setSelectedForm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-2.5 py-1.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2 pt-3 border-t border-[#eceae5]">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[#171717] uppercase tracking-wider">
                  Max Price
                </label>
                <span className="font-mono font-bold text-[#0f4c42] bg-[#f2f1ec] px-2 py-0.5 rounded">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                step="10"
                value={maxPrice}
                onChange={(e) => {
                  setIsLoading(true);
                  setMaxPrice(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#0f4c42] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#737373] font-mono">
                <span>₹20</span>
                <span>₹250</span>
              </div>
            </div>

            {/* Prescription Requirement */}
            <div className="space-y-1.5 pt-3 border-t border-[#eceae5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Availability Type
              </label>
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2 text-[#525252] cursor-pointer">
                  <input
                    type="radio"
                    name="rxFilter"
                    value="all"
                    checked={rxFilter === "all"}
                    onChange={() => {
                      setIsLoading(true);
                      setRxFilter("all");
                      setCurrentPage(1);
                    }}
                    className="accent-[#0f4c42]"
                  />
                  <span>All Listings</span>
                </label>
                <label className="flex items-center gap-2 text-[#525252] cursor-pointer">
                  <input
                    type="radio"
                    name="rxFilter"
                    value="otc"
                    checked={rxFilter === "otc"}
                    onChange={() => {
                      setIsLoading(true);
                      setRxFilter("otc");
                      setCurrentPage(1);
                    }}
                    className="accent-[#0f4c42]"
                  />
                  <span>Over the Counter (OTC)</span>
                </label>
                <label className="flex items-center gap-2 text-[#525252] cursor-pointer">
                  <input
                    type="radio"
                    name="rxFilter"
                    value="rx"
                    checked={rxFilter === "rx"}
                    onChange={() => {
                      setIsLoading(true);
                      setRxFilter("rx");
                      setCurrentPage(1);
                    }}
                    className="accent-[#0f4c42]"
                  />
                  <span>Prescription Required (Rx)</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Right Product Grid Area (9 cols) */}
          <main className="lg:col-span-9 space-y-4 text-left">
            {/* Action Bar: Count, Mobile Trigger, Sort Dropdown */}
            <div className="bg-white rounded-xl border border-[#e4e2dd] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f1ec] text-[#171717] rounded-lg text-xs font-semibold hover:bg-[#e8f3f1] transition cursor-pointer"
                >
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <span className="text-xs text-[#525252]">
                  Showing{" "}
                  <strong className="text-[#171717] font-bold">
                    {pagination.total}
                  </strong>{" "}
                  verified medicines near <strong>{buyerLocality}</strong>
                </span>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#737373] hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setIsLoading(true);
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-2.5 py-1 text-xs text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
                >
                  <option value="nearby">📍 Nearby First (Closest Handover)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="expiry-nearest">Expiry: Nearest First</option>
                </select>
              </div>
            </div>

            {/* Error State Banner */}
            {error && (
              <div className="p-3.5 bg-[#fff1f2] border border-[#fecdd3] rounded-xl text-xs text-[#9f1239] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-[#be123c]" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setCurrentPage((p) => p);
                  }}
                  className="font-bold underline text-[#9f1239] hover:text-[#881337] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Active Filters Tag Strip */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[#737373] text-[11px]">Active filters:</span>
                {selectedCategory !== "All Categories" && (
                  <span className="inline-flex items-center gap-1 bg-[#e8f3f1] text-[#0f4c42] border border-[#c4ded9] px-2 py-0.5 rounded-md font-medium">
                    {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange("All Categories")}
                      className="hover:text-[#9f1239] cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedForm !== "All Forms" && (
                  <span className="inline-flex items-center gap-1 bg-[#e8f3f1] text-[#0f4c42] border border-[#c4ded9] px-2 py-0.5 rounded-md font-medium">
                    {selectedForm}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setSelectedForm("All Forms");
                      }}
                      className="hover:text-[#9f1239] cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {maxPrice < 250 && (
                  <span className="inline-flex items-center gap-1 bg-[#e8f3f1] text-[#0f4c42] border border-[#c4ded9] px-2 py-0.5 rounded-md font-medium">
                    Under ₹{maxPrice}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setMaxPrice(250);
                      }}
                      className="hover:text-[#9f1239] cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {rxFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-[#e8f3f1] text-[#0f4c42] border border-[#c4ded9] px-2 py-0.5 rounded-md font-medium">
                    {rxFilter === "otc" ? "OTC Only" : "Rx Required"}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setRxFilter("all");
                      }}
                      className="hover:text-[#9f1239] cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-[#525252] hover:text-[#171717] underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Medicine Cards Grid or Loading Skeletons */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <MedicineCardSkeleton key={i} />
                ))}
              </div>
            ) : medicines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {medicines.map((medicine) => (
                  <MedicineCard
                    key={medicine._id || medicine.id}
                    medicine={medicine}
                    buyerLocality={buyerLocality}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No medicines match your criteria"
                description="Try broadening your search term, resetting price limits, or selecting All Categories."
                actionLabel="Reset All Filters"
                onAction={handleClearAllFilters}
              />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-5 border-t border-[#e4e2dd]">
                <span className="text-xs text-[#525252]">
                  Page <strong>{pagination.page}</strong> of{" "}
                  <strong>{pagination.pages}</strong> ({pagination.total} total listings)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => {
                      setIsLoading(true);
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e4e2dd] bg-white text-[#525252] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>

                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => {
                        setIsLoading(true);
                        setCurrentPage(i + 1);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        currentPage === i + 1
                          ? "bg-[#0f4c42] text-white"
                          : "bg-white border border-[#e4e2dd] text-[#525252] hover:bg-[#f7f7f4]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => {
                      setIsLoading(true);
                      setCurrentPage((p) => Math.min(pagination.pages, p + 1));
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e4e2dd] bg-white text-[#525252] hover:bg-[#f7f7f4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#171717]/50 backdrop-blur-2xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-xl p-5 overflow-y-auto space-y-5 text-left border-l border-[#e4e2dd]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae5]">
              <h3 className="font-bold text-[#171717] text-sm">Filters</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-[#737373] hover:text-[#171717]"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Locality in Mobile */}
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Your Locality (Pune)
              </label>
              <select
                value={buyerLocality}
                onChange={(e) => {
                  handleLocalityChange(e.target.value);
                  setIsMobileFilterOpen(false);
                }}
                className="w-full bg-[#f0f9f8] border border-[#c4ded9] text-[#0f4c42] font-bold text-xs rounded-md px-2.5 py-1.5"
              >
                {PUNE_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} (PIN: {loc.pinCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      handleCategoryChange(cat);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#0f4c42] text-white font-bold"
                        : "text-[#525252] hover:bg-[#f7f7f4]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="pt-3 border-t border-[#eceae5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Max Price: ₹{maxPrice}
              </label>
              <input
                type="range"
                min="20"
                max="250"
                step="10"
                value={maxPrice}
                onChange={(e) => {
                  setIsLoading(true);
                  setMaxPrice(Number(e.target.value));
                }}
                className="w-full accent-[#0f4c42]"
              />
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-2.5 bg-[#0f4c42] hover:bg-[#0a362f] text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer"
            >
              Apply Filters ({pagination.total})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}