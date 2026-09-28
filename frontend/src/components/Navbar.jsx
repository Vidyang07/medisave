import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import {
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  ChevronDownIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "./common/Icons";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/buy?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch("");
    }
  };

  const navLinkClass = ({ isActive }) =>
    `text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 transition-colors border ${
      isActive
        ? "text-white bg-[#166534] border-[#166534]"
        : "text-[#27272a] border-transparent hover:border-[#27272a] hover:bg-[#f0eee7]"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#f8f7f4] border-b-2 border-[#27272a]">
      {/* Clinical Warning / Domain Header Top Stripe */}
      <div className="bg-[#27272a] text-[#f8f7f4] text-[10px] font-mono py-1 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="stamp-rx text-[9px]">CEP PUNE</span>
          <span>COMMUNITY MEDICINE EXCHANGE & REDISTRIBUTION REGISTRY</span>
        </div>
        <div className="hidden sm:block text-[#a1a1aa]">
          KATRAJ · KOTHRUD · HINJEWADI · SWARGATE · BANER
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#166534] text-white flex items-center justify-center font-bold text-sm">
                +
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-bold font-heading tracking-tight text-[#141416] leading-none">
                  MEDI<span className="text-[#166534]">SAVE</span>
                </span>
                <span className="text-[9px] font-mono font-semibold text-[#52525b] uppercase leading-tight mt-0.5">
                  Pune Community Registry
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/buy" className={navLinkClass}>
                Price Sheet
              </NavLink>
              <NavLink to="/sell" className={navLinkClass}>
                List Medicine
              </NavLink>
              {isAuthenticated && user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5 border ${
                      isActive
                        ? "text-white bg-[#b91c1c] border-[#b91c1c]"
                        : "text-[#b91c1c] border-[#b91c1c] hover:bg-[#fef2f2]"
                    }`
                  }
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  Admin Console
                </NavLink>
              )}
            </nav>
          </div>

          {/* Search bar in desktop navbar */}
          <form
            onSubmit={handleNavSearch}
            className="hidden lg:flex items-center flex-1 max-w-xs relative"
          >
            <SearchIcon className="w-3.5 h-3.5 text-[#71737c] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search salt, brand, batch..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-white border border-[#27272a] text-xs font-mono text-[#141416] pl-8 pr-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#166534] placeholder-[#71737c]"
            />
          </form>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Cart / Order Request Drawer Trigger */}
            <button
              onClick={openCart}
              className="relative px-2.5 py-1.5 bg-white border border-[#27272a] hover:bg-[#f0eee7] text-[#141416] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              title="View Medicine Requests"
              aria-label="View Order Requests"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {itemCount > 0 && (
                <span className="bg-[#166534] text-white text-[10px] font-bold px-1.5 py-0.2">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Authentication / User Profile */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#27272a] hover:bg-[#f0eee7] transition cursor-pointer text-xs font-mono"
                >
                  <div className="w-5 h-5 bg-[#166534] text-white flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="font-bold text-[#141416] max-w-[100px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-[#52525b]" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border-2 border-[#27272a] py-1 z-50 text-left font-mono text-xs shadow-none">
                    <div className="px-3 py-2 border-b border-[#d4d4d8] bg-[#f8f7f4]">
                      <p className="font-bold text-[#141416] truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[#52525b] truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        <span className={user.role === "admin" ? "stamp-rx text-[9px]" : "stamp-box text-[9px]"}>
                          {user.role === "admin" ? "ADMINISTRATOR" : "COMMUNITY MEMBER"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[#141416] hover:bg-[#f0eee7]"
                      >
                        <PackageIcon className="w-3.5 h-3.5" />
                        Member Dashboard
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-[#b91c1c] font-bold hover:bg-[#fef2f2]"
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          Admin Console
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[#141416] hover:bg-[#f0eee7]"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="border-t border-[#d4d4d8] pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-[#b91c1c] font-bold hover:bg-[#fef2f2] cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-white hover:bg-[#f0eee7] text-[#141416] border border-[#27272a] text-xs font-mono font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white border border-[#166534] text-xs font-mono font-bold hidden sm:inline-block"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}