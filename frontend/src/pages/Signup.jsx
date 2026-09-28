import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Button } from "../components/common/Button";
import {
  PillIcon,
  ArrowRightIcon,
} from "../components/common/Icons";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    termsAgreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      showToast("Passwords do not match.", "error");
      return;
    }

    if (!formData.termsAgreed) {
      setErrorMessage("Please agree to the MEDISAVE Community Verification Guidelines.");
      showToast("Please agree to the MEDISAVE Community Verification Guidelines.", "error");
      return;
    }

    setIsLoading(true);

    const result = await signup(formData);

    setIsLoading(false);

    if (result.success) {
      showToast("Account created successfully! Welcome to MEDISAVE.", "success");
      navigate("/dashboard");
    } else {
      setErrorMessage(result.message || "Registration failed.");
      showToast(result.message || "Registration failed.", "error");
    }
  };

  return (
    <div className="min-h-[90vh] bg-[#f7f7f4] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#e4e2dd] shadow-sm max-w-lg w-full p-8 sm:p-10 text-left space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0f4c42] text-white flex items-center justify-center mx-auto shadow-xs">
            <PillIcon className="w-6 h-6 transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">
            Create your MEDISAVE account
          </h1>
          <p className="text-xs text-[#525252]">
            Join the community to list unexpired surplus medicines or request verified treatments.
          </p>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Full Legal Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Dr. Ananya Sharma"
              required
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              City & Residential Locality
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Kothrud, Pune, Maharashtra"
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#171717]">
                  Password <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#0f4c42] hover:underline cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Confirm Password <span className="text-rose-600">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#525252] leading-snug">
              <input
                type="checkbox"
                name="termsAgreed"
                checked={formData.termsAgreed}
                onChange={handleChange}
                required
                className="accent-[#0f4c42] mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-[#0f4c42] underline font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-[#0f4c42] underline font-medium">
                  Privacy Policy
                </Link>
                , and certify that any medicines I list will be unexpired and in undamaged sealed
                packaging.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-sm"
            isLoading={isLoading}
          >
            Create Account
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-4 border-t border-[#e4e2dd] text-center text-xs text-[#737373]">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-bold text-[#0f4c42] hover:underline ml-1"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}