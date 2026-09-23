import React from "react";

const Badge = ({
  children,
  tone = "neutral",
  size = "sm",
  dot = false,
  className = "",
}) => {
  const tones = {
    success: {
      wrapper: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
      dot: "bg-[#059669]",
    },

    warning: {
      wrapper: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
      dot: "bg-[#D97706]",
    },

    danger: {
      wrapper: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
      dot: "bg-[#DC2626]",
    },

    info: {
      wrapper: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      dot: "bg-[#2563EB]",
    },

    primary: {
      wrapper: "bg-[#EEF2FF] text-[#000052] border-[#C7D2FE]",
      dot: "bg-[#000052]",
    },

    purple: {
      wrapper: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
      dot: "bg-[#7C3AED]",
    },

    neutral: {
      wrapper: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
      dot: "bg-[#64748B]",
    },

    dark: {
      wrapper: "bg-[#E8EAF6] text-[#000052] border-[#C5CAE9]",
      dot: "bg-[#000052]",
    },
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const selectedTone = tones[tone] || tones.neutral;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        font-semibold
        whitespace-nowrap
        ${selectedTone.wrapper}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${selectedTone.dot}`} />
      )}

      {children}
    </span>
  );
};

export default Badge;
