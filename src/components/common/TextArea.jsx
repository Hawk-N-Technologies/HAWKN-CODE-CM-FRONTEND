import React from "react";

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  required = false,
  disabled = false,
  error = "",
  className = "",
}) {
  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-cm-text">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-cm-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
          ${disabled ? "cursor-not-allowed bg-gray-100 opacity-60" : ""}
        `}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Textarea;
