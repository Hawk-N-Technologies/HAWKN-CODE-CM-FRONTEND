import React from "react";
import { Search, X } from "lucide-react";

const TableSearch = ({ value = "", onChange, placeholder = "Search..." }) => {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AAEC5]"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          h-11
          w-full
          rounded-xl
          border
          border-[#E0E8F2]
          bg-white
          pl-10
          pr-10
          text-sm
          font-medium
          text-[#16345C]
          outline-none
          transition-all
          duration-200
          placeholder:text-[#A5B5C9]
          hover:border-[#C9D8E8]
          focus:border-[#1769D2]
          focus:ring-2
          focus:ring-[#1769D2]/10
        "
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute
            right-3
            top-1/2
            flex
            -translate-y-1/2
            items-center
            justify-center
            rounded-md
            p-1
            text-[#94A3B8]
            transition
            hover:bg-[#F1F5F9]
            hover:text-[#16345C]
          "
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default TableSearch;
