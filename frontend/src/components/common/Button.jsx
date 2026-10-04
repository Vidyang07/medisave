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
    "inline-flex items-center justify-center rounded-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-sm px-5 py-3 gap-2",
  };

  const variantStyles = {
    primary:
      "bg-brand text-white hover:bg-brand-strong active:bg-brand-strong shadow-2xs",
    secondary:
      "bg-brand-tint text-brand hover:bg-brand-line/50 border border-brand-line",
    outline:
      "bg-white text-ink border border-line hover:bg-canvas hover:text-ink active:bg-line-soft shadow-2xs",
    ghost:
      "bg-transparent text-ink-muted hover:bg-sunken hover:text-ink active:bg-line",
    danger:
      "bg-danger text-white hover:opacity-90 shadow-2xs",
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
