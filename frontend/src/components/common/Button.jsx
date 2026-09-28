export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold tracking-tight rounded-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1 gap-1.5",
    md: "text-xs sm:text-sm px-4 py-2 gap-2",
    lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#166534] text-white hover:bg-[#14532d] active:bg-[#052e16] border border-[#166534]",
    secondary:
      "bg-[#f0eee7] text-[#141416] hover:bg-[#e4e2d8] active:bg-[#d8d4c7] border border-[#27272a]",
    outline:
      "bg-white text-[#141416] border border-[#27272a] hover:bg-[#f8f7f4] active:bg-[#e4e4e7]",
    ghost:
      "bg-transparent text-[#27272a] hover:bg-[#f0eee7] hover:text-[#141416] active:bg-[#e4e4e7]",
    danger:
      "bg-[#b91c1c] text-white hover:bg-[#991b1b] active:bg-[#7f1d1d] border border-[#b91c1c]",
    foil:
      "bg-[#e2e5eb] text-[#1e293b] hover:bg-[#cbd5e1] border border-[#94a3b8]",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
