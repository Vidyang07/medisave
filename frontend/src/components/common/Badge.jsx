export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 tracking-wide",
    md: "text-xs px-2.5 py-0.5 font-medium",
    lg: "text-sm px-3 py-1 font-medium",
  };

  const variantStyles = {
    default: "bg-sunken text-ink-muted border-line",
    success: "bg-success-tint text-success border-success-line",
    verified: "bg-brand-tint text-brand border-brand-line font-semibold",
    warning: "bg-warning-tint text-warning border-warning-line",
    danger: "bg-danger-tint text-danger border-danger-line",
    info: "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]",
    brand: "bg-brand text-white border-transparent",
    outline: "bg-transparent text-ink-muted border-line",
    prescription: "bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe] font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
}
