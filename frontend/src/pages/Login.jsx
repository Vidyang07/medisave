import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Button } from "../components/common/Button";
import {
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
    <div className="min-h-[85vh] bg-[#f8f7f4] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-none border-2 border-[#27272a] max-w-md w-full p-8 sm:p-10 text-left space-y-6">
        {/* Brand Header */}
        <div className="text-left space-y-2 border-b-2 border-[#27272a] pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#b91c1c] tracking-widest uppercase">
              [AUTH-GATEWAY]
            </span>
            <span className="stamp-box text-[10px] uppercase font-mono">
              PUNE-COMMUNITY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#18181b] tracking-tight uppercase">
            Sign In to MEDISAVE
          </h1>
          <p className="text-xs text-[#52525b] font-mono">
            Direct access to Pune medicine listings, verified orders, and handover dockets.
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-[#e2e5eb] border border-[#27272a] rounded-none flex items-center gap-2 text-xs text-[#27272a] font-mono">
          <ShieldCheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Localised token authentication & clinical inspection protocol.</span>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-2 border-[#b91c1c] rounded-none text-xs text-[#b91c1c] font-mono font-medium">
            [ERROR]: {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. resident@kothrud.pune"
              required
              autoComplete="email"
              className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-mono text-[#166534] hover:underline cursor-pointer uppercase"
              >
                [{showPassword ? "Hide" : "Show"}]
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#52525b] pt-1 font-mono">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded-none accent-[#166534]"
              />
              <span>Remember station</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Authenticate & Sign In
          </Button>
        </form>

        {/* Footer Link to Signup */}
        <div className="pt-4 border-t-2 border-[#27272a] text-left text-xs font-mono text-[#52525b]">
          New community member?{" "}
          <Link
            to="/signup"
            className="font-bold text-[#166534] hover:underline uppercase"
          >
            Register Pune Account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}