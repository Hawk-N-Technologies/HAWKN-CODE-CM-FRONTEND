import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-[#000052] text-white shadow-sm hover:bg-[#00003D] focus:ring-[#000052]",
    secondary:
      "bg-white text-[#000052] border border-[#D9E2EF] shadow-sm hover:bg-[#F4F7FB] hover:border-[#BFCDE0] focus:ring-[#000052]",

    outline:
      "border border-[#1769D2] bg-white text-[#1769D2] hover:bg-[#EEF5FF] focus:ring-[#1769D2]",

    ghost:
      "bg-transparent text-[#16345C] hover:bg-[#F1F5F9] focus:ring-[#1769D2]",

    success:
      "bg-[#08A878] text-white shadow-sm hover:bg-[#078F67] focus:ring-[#08A878]",

    warning:
      "bg-[#F59E0B] text-white shadow-sm hover:bg-[#D97706] focus:ring-[#F59E0B]",

    danger:
      "bg-[#E53935] text-white shadow-sm hover:bg-[#D32F2F] focus:ring-[#E53935]",
  };

  const sizes = {
    xs: "h-8 px-3 text-xs",
    sm: "h-9 px-3.5 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
    xl: "h-12 px-6 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex shrink-0 items-center">{leftIcon}</span>
          )}

          <span>{children}</span>

          {rightIcon && (
            <span className="flex shrink-0 items-center">{rightIcon}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
