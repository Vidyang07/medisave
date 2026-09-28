import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Button } from "../components/common/Button";
import {
  PillIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "../components/common/Icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    setIsLoading(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user?.name}!`, "success");
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.message || "Invalid credentials. Please try again.");
      showToast(result.message || "Login failed.", "error");
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#f7f7f4] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#e4e2dd] shadow-sm max-w-md w-full p-8 sm:p-10 text-left space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0f4c42] text-white flex items-center justify-center mx-auto shadow-xs">
            <PillIcon className="w-6 h-6 transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">
            Sign in to MEDISAVE
          </h1>
          <p className="text-xs text-[#525252]">
            Access your medicine listings, orders, prescriptions, and verified requests.
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-[#fafaf7] border border-[#e4e2dd] rounded-xl flex items-center gap-2 text-xs text-[#525252]">
          <ShieldCheckIcon className="w-4 h-4 text-[#0f4c42] shrink-0" />
          <span>Encrypted healthcare authentication and community verification.</span>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#171717]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#0f4c42] hover:underline cursor-pointer"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full bg-[#fafaf7] border border-[#e4e2dd] rounded-lg px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#0f4c42] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#525252] pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="accent-[#0f4c42]"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-sm"
            isLoading={isLoading}
          >
            Sign In
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Footer Link to Signup */}
        <div className="pt-4 border-t border-[#e4e2dd] text-center text-xs text-[#737373]">
          Don't have an account yet?{" "}
          <Link
            to="/signup"
            className="font-bold text-[#0f4c42] hover:underline ml-1"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}