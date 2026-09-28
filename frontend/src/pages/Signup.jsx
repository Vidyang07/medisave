import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { Button } from "../components/common/Button";

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
    <div className="min-h-[90vh] bg-[#f8f7f4] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-none border-2 border-[#27272a] max-w-lg w-full p-8 sm:p-10 text-left space-y-6">
        {/* Brand Header */}
        <div className="text-left space-y-2 border-b-2 border-[#27272a] pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#b91c1c] tracking-widest uppercase">
              [REGISTRATION-DESK]
            </span>
            <span className="stamp-box text-[10px] uppercase font-mono">
              PUNE-NETWORK
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#18181b] tracking-tight uppercase">
            Create MEDISAVE Account
          </h1>
          <p className="text-xs text-[#52525b] font-mono">
            Register to redistribute surplus unexpired medicines or access verified community inventory.
          </p>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-2 border-[#b91c1c] rounded-none text-xs text-[#b91c1c] font-mono font-medium">
            [ERROR]: {errorMessage}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
              Full Legal Name <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ronit Subhedar"
              required
              className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
                Email Address <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@domain.com"
                required
                className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
              Pune Locality / Handover Area
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Katraj, Kothrud, Hinjewadi, Pune"
              className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a]">
                  Password <span className="text-[#b91c1c]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono text-[#166534] hover:underline cursor-pointer uppercase"
                >
                  [{showPassword ? "Hide" : "Show"}]
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#27272a] mb-1">
                Confirm Password <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="w-full bg-[#f8f7f4] border-2 border-[#27272a] rounded-none px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:bg-white transition"
              />
            </div>
          </div>

          <div className="pt-2 p-3 bg-[#e2e5eb] border border-[#27272a] rounded-none">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-mono text-[#27272a] leading-snug">
              <input
                type="checkbox"
                name="termsAgreed"
                checked={formData.termsAgreed}
                onChange={handleChange}
                required
                className="rounded-none accent-[#166534] mt-0.5"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-[#166534] underline font-bold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-[#166534] underline font-bold">
                  Privacy Policy
                </Link>
                , and certify that listed medicines will be unexpired and in undamaged sealed
                blister packaging.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Complete Registration
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-4 border-t-2 border-[#27272a] text-left text-xs font-mono text-[#52525b]">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-bold text-[#166534] hover:underline uppercase"
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}