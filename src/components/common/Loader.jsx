import React from "react";
import { LoaderCircle } from "lucide-react";

const Loader = ({
  icon: LoaderIcon = LoaderCircle,
  size = "md",
  text = "",
  color = "#000052",
  strokeWidth = 2.2,
  className = "",
  textClassName = "",
}) => {
  const sizes = {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 32,
    xl: 40,
  };

  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <LoaderIcon
        size={sizes[size]}
        color={color}
        strokeWidth={strokeWidth}
        className="animate-spin"
      />

      {text && (
        <span className={`text-sm font-medium text-[#71839B] ${textClassName}`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;
