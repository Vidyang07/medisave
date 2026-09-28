export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}) {
  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.2 tracking-wide font-mono",
    md: "text-xs px-2 py-0.5 font-mono font-medium",
    lg: "text-xs sm:text-sm px-2.5 py-1 font-mono font-medium",
  };

  const variantStyles = {
    default: "bg-[#f0eee7] text-[#27272a] border-[#d4d4d8]",
    success: "bg-[#f0fdf4] text-[#166534] border-[#166534] font-semibold",
    verified: "bg-[#f0fdf4] text-[#166534] border-[#166534] font-bold",
    warning: "bg-[#fffbeb] text-[#92400e] border-[#d97706]",
    danger: "bg-[#fef2f2] text-[#b91c1c] border-[#b91c1c] font-bold",
    info: "bg-[#f1f5f9] text-[#334155] border-[#64748b]",
    brand: "bg-[#166534] text-white border-[#166534] font-bold",
    outline: "bg-transparent text-[#27272a] border-[#27272a]",
    prescription: "bg-[#fef2f2] text-[#b91c1c] border-[#b91c1c] font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-none ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
}
