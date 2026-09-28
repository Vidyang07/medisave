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
    default: "bg-[#f2f1ec] text-[#525252] border-[#e4e2dd]",
    success: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    verified: "bg-[#e8f3f1] text-[#0f4c42] border-[#c4ded9] font-semibold",
    warning: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
    danger: "bg-[#fff1f2] text-[#9f1239] border-[#fecdd3]",
    info: "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]",
    brand: "bg-[#0f4c42] text-white border-transparent",
    outline: "bg-transparent text-[#525252] border-[#e4e2dd]",
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
