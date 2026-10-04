import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  PillIcon,
  SearchIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "./common/Icons";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      setIsMobileMenuOpen(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `text-xs font-semibold tracking-wide transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? "text-[#0f4c42] bg-[#e8f3f1] font-bold"
        : "text-[#525252] hover:text-[#0f4c42] hover:bg-[#f2f1ec]"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#fafaf7]/95 backdrop-blur-md border-b border-[#e4e2dd] shadow-2xs">
      {/* Top Visible Community Notice Banner */}
      <div className="bg-[#0f4c42] text-white text-[11px] font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <ShieldCheckIcon className="w-3.5 h-3.5 text-[#a7f3d0] shrink-0" />
        <span>No buying or selling. MEDISAVE connects eligible unused medicines with verified community healthcare partners.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#0f4c42] text-white flex items-center justify-center shadow-2xs group-hover:bg-[#0a362f] transition">
                <PillIcon className="w-4 h-4 transform -rotate-45 text-[#a7f3d0]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold tracking-tight text-[#171717] leading-none">
                  MEDI<span className="text-[#0f4c42]">SAVE</span>
                </span>
                <span className="text-[10px] font-semibold text-[#737373] tracking-wider uppercase leading-tight mt-0.5">
                  Verified Donation Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/buy" className={navLinkClass}>
                Browse Donations
              </NavLink>
              <NavLink to="/sell" className={navLinkClass}>
                Donate Medicine
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  My Cabinet
                </NavLink>
              )}
              <NavLink to="/disposal-guide" className={navLinkClass}>
                Safe Disposal
              </NavLink>
              {isAuthenticated && (user?.role === "partner" || user?.role === "admin") && (
                <NavLink
                  to="/partner"
                  className={({ isActive }) =>
                    `text-xs font-bold transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      isActive
                        ? "text-[#0f4c42] bg-[#d1fae5] font-extrabold shadow-2xs"
                        : "text-[#065f46] bg-[#ecfdf5] hover:bg-[#d1fae5]"
                    }`
                  }
                >
                  <PackageIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                  Partner Portal
                </NavLink>
              )}
              {isAuthenticated && user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs font-bold transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      isActive
                        ? "text-[#92400e] bg-[#fef3c7]"
                        : "text-[#b45309] hover:text-[#78350f] hover:bg-[#fffbeb]"
                    }`
                  }
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-[#d97706]" />
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
            <SearchIcon className="w-3.5 h-3.5 text-[#737373] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search donations, salts..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-[#f2f1ec] border border-[#e4e2dd] text-xs text-[#171717] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition placeholder-[#737373]"
            />
          </form>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authentication / User Profile */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#e4e2dd] hover:border-[#d1cfc7] hover:bg-[#f2f1ec] transition cursor-pointer bg-white"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#e4e2dd]"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#0f4c42] text-white flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#171717] leading-tight max-w-[110px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#0f4c42] font-medium leading-none">
                      {user.role === "admin"
                        ? "Admin"
                        : user.role === "partner"
                        ? "Partner Org"
                        : "Donor / Member"}
                    </span>
                  </div>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-[#737373] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e4e2dd] py-1.5 z-50 text-left">
                    <div className="px-4 py-2 border-b border-[#e4e2dd]">
                      <p className="text-xs font-bold text-[#171717] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#525252] truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#262626] hover:bg-[#f2f1ec] hover:text-[#0f4c42] transition"
                      >
                        <PackageIcon className="w-4 h-4 text-[#737373]" />
                        Donor Dashboard
                      </Link>
                      {(user?.role === "partner" || user?.role === "admin") && (
                        <Link
                          to="/partner"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#065f46] hover:bg-[#ecfdf5] transition font-semibold"
                        >
                          <PackageIcon className="w-4 h-4 text-[#0f4c42]" />
                          Partner Portal
                        </Link>
                      )}
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#b45309] hover:bg-[#fffbeb] transition font-semibold"
                        >
                          <ShieldCheckIcon className="w-4 h-4 text-[#d97706]" />
                          Admin Console
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#262626] hover:bg-[#f2f1ec] hover:text-[#0f4c42] transition"
                      >
                        <UserIcon className="w-4 h-4 text-[#737373]" />
                        My Profile & Settings
                      </Link>
                    </div>

                    <div className="border-t border-[#e4e2dd] pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#be123c] hover:bg-[#fff1f2] transition text-left cursor-pointer"
                      >
                        <LogOutIcon className="w-4 h-4 text-[#be123c]" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#262626] hover:text-[#0f4c42] px-3 py-1.5 rounded-lg hover:bg-[#f2f1ec] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-semibold bg-[#0f4c42] text-white hover:bg-[#0a362f] px-3.5 py-1.5 rounded-lg transition shadow-2xs"
                >
                  Join Community
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[#262626] hover:text-[#0f4c42] hover:bg-[#f2f1ec] transition md:hidden cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#e4e2dd] bg-[#fafaf7] px-4 pt-3 pb-6 space-y-3 text-left">
          <form onSubmit={handleNavSearch} className="relative">
            <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search medicines, salts..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-white border border-[#e4e2dd] text-xs rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42]"
            />
          </form>

          <nav className="flex flex-col space-y-1 pt-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
            >
              Home
            </Link>
            <Link
              to="/buy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
            >
              Browse Donations
            </Link>
            <Link
              to="/sell"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
            >
              Donate Medicine
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
              >
                My Cabinet
              </Link>
            )}
            <Link
              to="/disposal-guide"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
            >
              Safe Disposal Guide
            </Link>
            {isAuthenticated && (user?.role === "partner" || user?.role === "admin") && (
              <Link
                to="/partner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-[#065f46] bg-[#ecfdf5] transition flex items-center gap-1.5"
              >
                <PackageIcon className="w-3.5 h-3.5 text-[#0f4c42]" />
                Partner Portal
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#b45309] bg-[#fef3c7] transition"
              >
                Admin Moderation Console
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-[#262626] hover:bg-[#e8f3f1] hover:text-[#0f4c42] transition"
              >
                Profile & Preferences
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-[#e4e2dd] flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold text-[#be123c] bg-[#fff1f2] rounded-lg transition cursor-pointer"
              >
                Sign Out ({user?.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold text-[#262626] bg-[#f2f1ec] rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold text-white bg-[#0f4c42] rounded-lg"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}