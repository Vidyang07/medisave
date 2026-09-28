import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import MedicineCard from "../components/MedicineCard";
import { CATEGORIES, DOSAGE_FORMS } from "../data/mockData";
import { Breadcrumb } from "../components/common/Breadcrumb";
import { MedicineCardSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  AlertCircleIcon,
  MapPinIcon,
} from "../components/common/Icons";
import { PUNE_LOCALITIES } from "../utils/localityConstants";

export default function BuyMedicine() {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "All Categories";
  const urlLocality = searchParams.get("locality") || "Katraj";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedForm, setSelectedForm] = useState("All Forms");
  const [maxPrice, setMaxPrice] = useState(250);
  const [rxFilter, setRxFilter] = useState("all"); // 'all', 'otc', 'rx'
  const [sortBy, setSortBy] = useState("nearby");
  const [buyerLocality, setBuyerLocality] = useState(urlLocality);
  const [viewMode, setViewMode] = useState("ledger"); // 'ledger' (Chemist sheet) vs 'grid' (Card tags)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [error, setError] = useState(null);

  const itemsPerPage = 12;

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
          setError(err.response?.data?.message || "Failed to query medicine database.");
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

  const handleTableQuickAdd = (med) => {
    const medId = med._id || med.id;
    const title = med.brandName || med.medicineName || med.name || "Medicine";
    addToCart(
      {
        ...med,
        id: medId,
        name: title,
        brandName: title,
        company: med.company || "Standard Manufacturer",
        strength: med.strength || "",
        price: med.price !== undefined ? med.price : 0,
        originalMrp: med.originalMrp || med.price,
        image: med.image,
        isPrescriptionRequired: Boolean(med.isPrescriptionRequired),
        locality: med.locality || "Pune",
        handoverPoint: med.handoverPoint || med.locality || "Pune Handover Hub",
      },
      1
    );
    showToast(`Added ${title} to order request`, "success");
  };

  const activeFilterCount =
    (selectedCategory !== "All Categories" ? 1 : 0) +
    (selectedForm !== "All Forms" ? 1 : 0) +
    (maxPrice < 250 ? 1 : 0) +
    (rxFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#f8f7f4] py-6 sm:py-8 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Pune Medicine Register" }]} />

        {/* Header Title & Subtitle */}
        <div className="border-b-2 border-[#27272a] pb-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-box text-[11px]">PUNE SECTOR REGISTRY</span>
                <span className="stamp-green text-[11px]">LIVE VERIFIED INVENTORY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#141416] font-heading tracking-tight mt-1.5">
                Chemist's Community Price Sheet & Register
              </h1>
              <p className="text-xs sm:text-sm text-[#4b4d52] mt-1 max-w-2xl leading-relaxed">
                Indexed surplus medications from verified Pune donors. All listings enforce 40%–65% community pricing and require sealed packaging with minimum 90-day remaining shelf life.
              </p>
            </div>

            {/* Quick Search Field in Header */}
            <div className="w-full md:w-80">
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-[#71737c] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setIsLoading(true);
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search brand, salt, locality..."
                  className="w-full bg-white border-2 border-[#27272a] pl-9 pr-8 py-2 text-xs sm:text-sm text-[#141416] placeholder-[#71737c] focus:outline-none focus:ring-2 focus:ring-[#166534] font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-[#71737c] hover:text-[#141416] cursor-pointer"
                    aria-label="Clear search"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BUYER LOCALITY SELECTOR & LOGISTICS CLARITY STRIP */}
        <div className="bg-white border-2 border-[#27272a] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#166534] text-white flex items-center justify-center shrink-0">
              <MapPinIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#141416] uppercase">
                  Current Recipient Locality:
                </span>
                <select
                  value={buyerLocality}
                  onChange={(e) => handleLocalityChange(e.target.value)}
                  className="bg-[#f8f7f4] border-2 border-[#27272a] text-[#141416] font-mono font-bold text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#166534] cursor-pointer"
                >
                  {PUNE_LOCALITIES.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} (PIN: {loc.pinCode})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] font-mono text-[#52525b] mt-0.5">
                Proximity computed from <strong>{buyerLocality}</strong>. Handover is coordinated directly between buyer and donor at verified pickup points.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono bg-[#f0eee7] px-3 py-1.5 border border-[#d4d4d8] shrink-0 text-[#27272a]">
            Sorting: <strong>Haversine Proximity</strong>
          </div>
        </div>

        {/* Quick Filter Horizontal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 font-mono font-bold transition cursor-pointer whitespace-nowrap border border-[#27272a] ${
                selectedCategory === cat
                  ? "bg-[#166534] text-white"
                  : "bg-white text-[#27272a] hover:bg-[#f0eee7]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-Column Marketplace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Desktop Sidebar Filters (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border-2 border-[#27272a] p-4 sm:p-5 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-[#166534]" />
                <h2 className="text-xs sm:text-sm font-bold font-mono text-[#141416] uppercase">Filter Registry</h2>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-mono text-[#b91c1c] hover:underline font-bold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter List */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-[#141416] uppercase tracking-wider">
                Therapeutic Class
              </label>
              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-2 py-1 text-xs font-mono transition cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-[#166534] text-white font-bold"
                        : "text-[#4b4d52] hover:bg-[#f8f7f4] hover:text-[#141416]"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="text-[10px]">●</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosage Form Filter */}
            <div className="space-y-1.5 pt-3 border-t border-[#d4d4d8]">
              <label className="block text-[11px] font-mono font-bold text-[#141416] uppercase tracking-wider">
                Dosage Formulation
              </label>
              <select
                value={selectedForm}
                onChange={(e) => {
                  setIsLoading(true);
                  setSelectedForm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#f8f7f4] border border-[#27272a] px-2.5 py-1.5 text-xs text-[#141416] font-mono focus:outline-none focus:ring-2 focus:ring-[#166534]"
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2 pt-3 border-t border-[#d4d4d8]">
              <div className="flex justify-between items-center text-xs font-mono">
                <label className="font-bold text-[#141416] uppercase">
                  Price Ceiling
                </label>
                <span className="font-bold text-[#166534] bg-[#f0fdf4] border border-[#166534] px-1.5 py-0.5">
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
                className="w-full accent-[#166534] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#71737c] font-mono">
                <span>₹20</span>
                <span>₹250</span>
              </div>
            </div>

            {/* Prescription Requirement */}
            <div className="space-y-1.5 pt-3 border-t border-[#d4d4d8]">
              <label className="block text-[11px] font-mono font-bold text-[#141416] uppercase tracking-wider">
                Prescription Classification
              </label>
              <div className="space-y-1 text-xs font-mono">
                <label className="flex items-center gap-2 text-[#4b4d52] cursor-pointer">
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
                    className="accent-[#166534]"
                  />
                  <span>All Registered Items</span>
                </label>
                <label className="flex items-center gap-2 text-[#4b4d52] cursor-pointer">
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
                    className="accent-[#166534]"
                  />
                  <span>OTC General Only</span>
                </label>
                <label className="flex items-center gap-2 text-[#4b4d52] cursor-pointer">
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
                    className="accent-[#b91c1c]"
                  />
                  <span>Schedule H/Rx Required</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Right Area: Table / Grid Display (9 cols) */}
          <main className="lg:col-span-9 space-y-4 text-left">
            {/* Action Bar: Count, View Mode Switcher, Sort Dropdown */}
            <div className="bg-white border-2 border-[#27272a] p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#f0eee7] text-[#141416] border border-[#27272a] text-xs font-mono font-bold cursor-pointer"
                >
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <span className="text-xs font-mono text-[#52525b]">
                  Showing <strong className="text-[#141416]">{pagination.total}</strong> verified items near <strong>{buyerLocality}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* View Switcher: Dense Chemist Sheet vs Grid Cards */}
                <div className="hidden sm:flex items-center border border-[#27272a] font-mono text-xs">
                  <button
                    onClick={() => setViewMode("ledger")}
                    className={`px-2.5 py-1 font-bold cursor-pointer ${
                      viewMode === "ledger"
                        ? "bg-[#166534] text-white"
                        : "bg-white text-[#27272a] hover:bg-[#f0eee7]"
                    }`}
                  >
                    Price Sheet
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1 font-bold cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-[#166534] text-white"
                        : "bg-white text-[#27272a] hover:bg-[#f0eee7]"
                    }`}
                  >
                    Shelf Cards
                  </button>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-[#71737c] hidden md:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setIsLoading(true);
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-[#f8f7f4] border border-[#27272a] px-2 py-1 text-xs text-[#141416] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  >
                    <option value="nearby">Proximity: Nearest First</option>
                    <option value="price-low">Rate: Low to High</option>
                    <option value="price-high">Rate: High to Low</option>
                    <option value="expiry-nearest">Expiry: Nearest First</option>
                    <option value="newest">Newest Listed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error State Banner */}
            {error && (
              <div className="p-3 bg-[#fef2f2] border-2 border-[#b91c1c] text-xs font-mono text-[#b91c1c] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setCurrentPage((p) => p);
                  }}
                  className="font-bold underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Active Filters Tag Strip */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-[#71737c] text-[11px]">ACTIVE FILTERS:</span>
                {selectedCategory !== "All Categories" && (
                  <span className="stamp-box text-[10px]">
                    {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange("All Categories")}
                      className="hover:text-[#b91c1c] cursor-pointer ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedForm !== "All Forms" && (
                  <span className="stamp-box text-[10px]">
                    {selectedForm}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setSelectedForm("All Forms");
                      }}
                      className="hover:text-[#b91c1c] cursor-pointer ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {maxPrice < 250 && (
                  <span className="stamp-box text-[10px]">
                    ≤ ₹{maxPrice}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setMaxPrice(250);
                      }}
                      className="hover:text-[#b91c1c] cursor-pointer ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {rxFilter !== "all" && (
                  <span className={rxFilter === "rx" ? "stamp-rx text-[10px]" : "stamp-box text-[10px]"}>
                    {rxFilter === "otc" ? "OTC Only" : "Rx Required"}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        setRxFilter("all");
                      }}
                      className="hover:text-[#b91c1c] cursor-pointer ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-mono text-[#b91c1c] underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Main Content: Dense Chemist Price Sheet / Ledger Table or Shelf Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <MedicineCardSkeleton key={i} />
                ))}
              </div>
            ) : medicines.length > 0 ? (
              viewMode === "ledger" ? (
                /* DENSE CHEMIST PRICE SHEET TABLE */
                <div className="border-2 border-[#27272a] bg-white overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-[#f0eee7] border-b-2 border-[#27272a] font-mono text-[10px] text-[#27272a] uppercase">
                        <th className="p-2.5 border-r border-[#d4d4d8] w-20">Type</th>
                        <th className="p-2.5 border-r border-[#d4d4d8]">Brand & Salt Formulation</th>
                        <th className="p-2.5 border-r border-[#d4d4d8]">Batch / Expiry</th>
                        <th className="p-2.5 border-r border-[#d4d4d8]">Handover Landmark & Proximity</th>
                        <th className="p-2.5 border-r border-[#d4d4d8] text-right">Printed MRP</th>
                        <th className="p-2.5 border-r border-[#d4d4d8] text-right">Community Rate</th>
                        <th className="p-2.5 text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4d4d8] font-mono">
                      {medicines.map((med) => {
                        const medId = med._id || med.id;
                        const title = med.brandName || med.medicineName || med.name;
                        const generic = med.genericName || med.medicineName || "";
                        const batch = med.batchNumber || "VERIFIED-BATCH";
                        const exp = med.expiryText || (med.expiryDate ? new Date(med.expiryDate).toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" }) : "Unexpired");
                        const originalMrp = med.originalMrp || med.price || 0;
                        const price = med.price !== undefined ? med.price : 0;
                        const locality = med.locality || "Pune";
                        const handover = med.handoverPoint || locality;
                        const prox = med.proximity;
                        const isRx = Boolean(med.isPrescriptionRequired);

                        return (
                          <tr key={medId} className="hover:bg-[#f8f7f4] transition">
                            {/* Type badge */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top">
                              {isRx ? (
                                <span className="stamp-rx text-[9px]">Rx</span>
                              ) : (
                                <span className="stamp-box text-[9px]">OTC</span>
                              )}
                            </td>

                            {/* Brand & Salt */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top">
                              <Link
                                to={`/medicine/${medId}`}
                                className="font-sans font-bold text-sm text-[#141416] hover:text-[#166534] block leading-tight"
                              >
                                {title}
                              </Link>
                              <div className="text-[11px] text-[#52525b] mt-0.5 truncate max-w-xs" title={generic}>
                                {generic}
                              </div>
                              <div className="text-[10px] text-[#71737c]">
                                {med.company} · {med.dosageForm || "Tablet"} {med.strength && `(${med.strength})`}
                              </div>
                            </td>

                            {/* Batch & Expiry */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top whitespace-nowrap">
                              <div className="text-[11px] font-bold text-[#141416]">{batch}</div>
                              <div className="stamp-box text-[9px] text-[#b91c1c] border-[#b91c1c] bg-[#fef2f2] mt-0.5">
                                EXP: {exp}
                              </div>
                            </td>

                            {/* Handover & Proximity */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top">
                              <div className="font-bold text-[#141416] text-[11px] truncate max-w-[200px]">
                                {handover}
                              </div>
                              <div className="text-[10px] text-[#52525b] flex items-center gap-1 mt-0.5">
                                {prox?.distanceKm ? (
                                  <span className={prox.tier === "nearby" ? "text-[#166534] font-bold" : "text-[#b45309]"}>
                                    📍 {prox.distanceKm} km ({prox.tier === "nearby" ? "Nearby" : "Local"})
                                  </span>
                                ) : (
                                  <span>{locality}</span>
                                )}
                              </div>
                            </td>

                            {/* Printed MRP */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top text-right line-through text-[#71737c]">
                              ₹{originalMrp}
                            </td>

                            {/* Community Rate */}
                            <td className="p-2.5 border-r border-[#d4d4d8] align-top text-right">
                              <div className="font-bold text-sm text-[#166534]">₹{price}</div>
                              {originalMrp > price && (
                                <div className="text-[10px] text-[#52525b]">
                                  -{Math.round(((originalMrp - price) / originalMrp) * 100)}%
                                </div>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-2.5 align-top text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleTableQuickAdd(med)}
                                  className="px-2 py-1 bg-[#f0eee7] hover:bg-[#e4e2d8] text-[#141416] border border-[#27272a] text-[10px] font-bold cursor-pointer transition"
                                  title="Add to request"
                                >
                                  + Order
                                </button>
                                <Link
                                  to={`/medicine/${medId}`}
                                  className="px-2 py-1 bg-[#166534] hover:bg-[#14532d] text-white border border-[#166534] text-[10px] font-bold transition"
                                >
                                  View
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* SHELF CARDS GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicines.map((medicine) => (
                    <MedicineCard
                      key={medicine._id || medicine.id}
                      medicine={medicine}
                      buyerLocality={buyerLocality}
                    />
                  ))}
                </div>
              )
            ) : (
              <EmptyState
                title={`No unexpired medicines match "${effectiveSearch || selectedCategory}"`}
                description={`No active listings found in ${buyerLocality} or matching the current filter. Try expanding your search to Bibvewadi or Swargate (within 5 km), or reset your price ceiling.`}
                actionLabel="Reset All Filters"
                onAction={handleClearAllFilters}
              />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t-2 border-[#27272a] font-mono text-xs">
                <span className="text-[#52525b]">
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} listings)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => {
                      setIsLoading(true);
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className="px-3 py-1 bg-white border border-[#27272a] text-[#141416] hover:bg-[#f0eee7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
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
                      className={`w-7 h-7 text-xs font-bold border border-[#27272a] cursor-pointer ${
                        currentPage === i + 1
                          ? "bg-[#166534] text-white"
                          : "bg-white text-[#141416] hover:bg-[#f0eee7]"
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
                    className="px-3 py-1 bg-white border border-[#27272a] text-[#141416] hover:bg-[#f0eee7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
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
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-[#f8f7f4] h-full p-5 overflow-y-auto space-y-5 text-left border-l-2 border-[#27272a]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#27272a]">
              <h3 className="font-bold font-mono text-[#141416] text-sm uppercase">Filter Registry</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-[#52525b] hover:text-[#141416]"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Locality in Mobile */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#141416] uppercase mb-1.5">
                Recipient Locality (Pune)
              </label>
              <select
                value={buyerLocality}
                onChange={(e) => {
                  handleLocalityChange(e.target.value);
                  setIsMobileFilterOpen(false);
                }}
                className="w-full bg-white border-2 border-[#27272a] text-[#141416] font-mono font-bold text-xs p-2"
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
              <label className="block text-xs font-mono font-bold text-[#141416] uppercase mb-1.5">
                Therapeutic Class
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      handleCategoryChange(cat);
                    }}
                    className={`w-full text-left px-2.5 py-1 text-xs font-mono cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#166534] text-white font-bold"
                        : "text-[#4b4d52] hover:bg-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="pt-3 border-t border-[#d4d4d8]">
              <label className="block text-xs font-mono font-bold text-[#141416] uppercase mb-1.5">
                Max Rate: ₹{maxPrice}
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
                className="w-full accent-[#166534]"
              />
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-2.5 bg-[#166534] text-white font-mono font-bold text-xs border border-[#166534] cursor-pointer uppercase"
            >
              Apply Filter ({pagination.total} Matches)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}