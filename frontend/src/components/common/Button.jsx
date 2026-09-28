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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c42] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#0f4c42] text-white hover:bg-[#0a362f] active:bg-[#072621] shadow-2xs",
    secondary:
      "bg-[#e8f3f1] text-[#0f4c42] hover:bg-[#d5ebe7] active:bg-[#c2e3dd] border border-[#c4ded9]",
    outline:
      "bg-white text-[#262626] border border-[#e4e2dd] hover:bg-[#f7f7f4] hover:text-[#171717] active:bg-[#eceae5] shadow-2xs",
    ghost:
      "bg-transparent text-[#525252] hover:bg-[#f2f1ec] hover:text-[#171717] active:bg-[#e4e2dd]",
    danger:
      "bg-[#be123c] text-white hover:bg-[#9f1239] active:bg-[#881337] shadow-2xs",
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
