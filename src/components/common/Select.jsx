import React from "react";
import { ChevronDown } from "lucide-react";

const Select = ({
  label,
  name,
  id,
  value = "",
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  wrapperClassName = "",
  ...props
}) => {
  const selectId = id || name;

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7890AE]"
        >
          {label}

          {required && <span className="ml-1 text-[#E53935]">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`
            h-11
            w-full
            appearance-none
            rounded-xl
            border
            bg-[#F8FAFC]
            px-3.5
            pr-10
            text-sm
            font-medium
            text-[#16345C]
            outline-none
            transition-all
            duration-200
            hover:border-[#C9D8E8]
            focus:bg-white
            focus:ring-2
            focus:ring-[#1769D2]/10
            disabled:cursor-not-allowed
            disabled:bg-[#F1F5F9]
            disabled:text-[#94A3B8]

            ${
              error
                ? "border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]/10"
                : "border-[#E0E8F2] focus:border-[#1769D2]"
            }

            ${className}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options.map((option) => {
            const optionValue =
              typeof option === "object" ? option.value : option;

            const optionLabel =
              typeof option === "object" ? option.label : option;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>

        <ChevronDown
          size={18}
          strokeWidth={2}
          className="
            pointer-events-none
            absolute
            right-3.5
            top-1/2
            -translate-y-1/2
            text-[#9AAEC5]
          "
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#E53935]">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#7890AE]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
