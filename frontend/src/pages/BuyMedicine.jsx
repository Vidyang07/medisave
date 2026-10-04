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
  ShieldCheckIcon,
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
          setError(err.response?.data?.message || "Failed to load donations from database.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveSearch, effectiveCategory, selectedForm, rxFilter, sortBy, buyerLocality, currentPage, itemsPerPage]);

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
    setRxFilter("all");
    setSortBy("nearby");
    setCurrentPage(1);
    setSearchParams({});
  };

  const activeFilterCount =
    (selectedCategory !== "All Categories" ? 1 : 0) +
    (selectedForm !== "All Forms" ? 1 : 0) +
    (rxFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-canvas py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Browse Donations" }]} />

        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-5 text-left">
          <div>
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Pune Community Donation Network
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1">
              Verified Community Medicine Donations
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
              Browse eligible unexpired medicines verified by MEDISAVE coordinators. All listings are 100% free donations redistributed through verified non-profit partners and community coordinators.
            </p>
          </div>

          {/* Quick Search Field in Header */}
          <div className="w-full md:w-80">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-ink-subtle absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setIsLoading(true);
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search brand, formula, locality..."
                className="w-full bg-white border border-line rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-ink-subtle hover:text-ink cursor-pointer"
                  aria-label="Clear search"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RECIPIENT / BUYER LOCALITY SELECTOR & HANDOVER BANNER */}
        <div className="bg-white rounded-xl border border-brand-line p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shrink-0">
              <MapPinIcon className="w-4 h-4 text-success-line" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-ink">
                  Your Locality in Pune:
                </span>
                <select
                  value={buyerLocality}
                  onChange={(e) => handleLocalityChange(e.target.value)}
                  className="bg-brand-tint border border-brand-line text-brand font-bold text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                >
                  {PUNE_LOCALITIES.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} (PIN: {loc.pinCode})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Listings are sorted by straight-line proximity to your selected locality. Physical handovers occur at verified community drop-off points.
              </p>
            </div>
          </div>

          <div className="text-xs text-brand font-medium bg-brand-tint px-3 py-1.5 rounded-lg border border-brand-line shrink-0">
            📍 Calculating distances from <strong>{buyerLocality}</strong>
          </div>
        </div>

        {/* Prescription / OTC Filter Tabs */}
        <div className="flex items-center gap-2 text-xs text-left flex-wrap">
          <button
            onClick={() => {
              setRxFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              rxFilter === "all"
                ? "bg-brand text-white shadow-2xs"
                : "bg-white border border-line text-ink-muted hover:bg-sunken"
            }`}
          >
            All Available Donations
          </button>
          <button
            onClick={() => {
              setRxFilter("otc");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              rxFilter === "otc"
                ? "bg-brand text-white shadow-2xs"
                : "bg-white border border-line text-ink-muted hover:bg-sunken"
            }`}
          >
            <span>Over-the-Counter (OTC)</span>
          </button>
          <button
            onClick={() => {
              setRxFilter("rx");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              rxFilter === "rx"
                ? "bg-brand text-white shadow-2xs"
                : "bg-white border border-line text-ink-muted hover:bg-sunken"
            }`}
          >
            <span>Prescription Required (Rx)</span>
          </button>
        </div>

        {/* Quick Filter Horizontal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs text-left">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-brand text-white font-semibold shadow-2xs"
                  : "bg-white border border-line text-ink-muted hover:bg-sunken hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-Column Donation Catalogue Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Desktop Sidebar Filters (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-xl border border-line p-4 sm:p-5 shadow-2xs space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-brand" />
                <h2 className="text-xs sm:text-sm font-bold text-ink">Filters</h2>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Category Filter List */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                Category
              </label>
              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-brand-tint text-brand font-bold border border-brand-line"
                        : "text-ink-muted hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosage Form Filter */}
            <div className="space-y-1.5 pt-3 border-t border-line-soft">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                Dosage Form
              </label>
              <select
                value={selectedForm}
                onChange={(e) => {
                  setIsLoading(true);
                  setSelectedForm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-alt border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>

            {/* Safety Standards Box */}
            <div className="pt-3 border-t border-line-soft space-y-2 text-xs text-ink-muted">
              <div className="flex items-center gap-1.5 text-brand font-bold">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Safety Standards</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-ink-subtle list-disc list-inside">
                <li>&ge; 90 days remaining shelf life</li>
                <li>Intact blister/foil seals only</li>
                <li>Strict cold-chain exclusion</li>
                <li>Admin & partner verified</li>
              </ul>
            </div>
          </aside>

          {/* Right Product Grid Area (9 cols) */}
          <main className="lg:col-span-9 space-y-4 text-left">
            {/* Action Bar: Count, Mobile Trigger, Sort Dropdown */}
            <div className="bg-white rounded-xl border border-line p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-sunken text-ink rounded-lg text-xs font-semibold hover:bg-brand-tint transition cursor-pointer"
                >
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <span className="text-xs text-ink-muted">
                  Showing{" "}
                  <strong className="text-ink font-bold">
                    {pagination.total}
                  </strong>{" "}
                  verified donations near <strong>{buyerLocality}</strong>
                </span>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-subtle hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setIsLoading(true);
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-surface-alt border border-line rounded-lg px-2.5 py-1 text-xs text-ink font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="nearby">📍 Nearby First (Closest Handover)</option>
                  <option value="newest">Newest First</option>
                  <option value="expiry-nearest">Expiry: Nearest First</option>
                </select>
              </div>
            </div>

            {/* Error State Banner */}
            {error && (
              <div className="p-3.5 bg-danger-tint border border-danger-line rounded-xl text-xs text-danger flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-danger" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setCurrentPage((p) => p);
                  }}
                  className="font-bold underline text-danger hover:text-[#881337] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Active Filters Tag Strip */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-ink-subtle text-[11px]">Active filters:</span>
                {selectedCategory !== "All Categories" && (
                  <span className="inline-flex items-center gap-1 bg-brand-tint text-brand border border-brand-line px-2 py-0.5 rounded-md font-medium">
                    {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange("All Categories")}
                      className="hover:text-danger cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedForm !== "All Forms" && (
                  <span className="inline-flex items-center gap-1 bg-brand-tint text-brand border border-brand-line px-2 py-0.5 rounded-md font-medium">
                    {selectedForm}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setSelectedForm("All Forms");
                      }}
                      className="hover:text-danger cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {rxFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-brand-tint text-brand border border-brand-line px-2 py-0.5 rounded-md font-medium">
                    {rxFilter === "otc" ? "OTC Only" : "Rx Required"}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setRxFilter("all");
                      }}
                      className="hover:text-danger cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-ink-muted hover:text-ink underline ml-1 cursor-pointer"
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
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No donations match your criteria"
                description="Try broadening your search query or selecting All Categories."
                actionLabel="Reset All Filters"
                onAction={handleClearAllFilters}
              />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-5 border-t border-line">
                <span className="text-xs text-ink-muted">
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
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-white text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                          ? "bg-brand text-white"
                          : "bg-white border border-line text-ink-muted hover:bg-canvas"
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
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-white text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
            className="fixed inset-0 bg-ink/50 backdrop-blur-2xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-xl p-5 overflow-y-auto space-y-5 text-left border-l border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <h3 className="font-bold text-ink text-sm">Filters</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-ink-subtle hover:text-ink"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Locality in Mobile */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Your Locality (Pune)
              </label>
              <select
                value={buyerLocality}
                onChange={(e) => {
                  handleLocalityChange(e.target.value);
                  setIsMobileFilterOpen(false);
                }}
                className="w-full bg-brand-tint border border-brand-line text-brand font-bold text-xs rounded-md px-2.5 py-1.5"
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
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
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
                        ? "bg-brand text-white font-bold"
                        : "text-ink-muted hover:bg-canvas"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-2.5 bg-brand hover:bg-brand-strong text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer"
            >
              Apply Filters ({pagination.total})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}