
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export default function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "Search and select...",
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const selectedValues = Array.isArray(value)
    ? value.map(String)
    : [];

  const selectedOptions = useMemo(
    () =>
      options.filter((option) =>
        selectedValues.includes(String(option.value))
      ),
    [options, selectedValues]
  );

  const availableOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return options.filter((option) => {
      const notSelected = !selectedValues.includes(
        String(option.value)
      );

      const matchesSearch = option.label
        .toLowerCase()
        .includes(query);

      return notSelected && matchesSearch;
    });
  }, [options, selectedValues, search]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const addOption = (option) => {
    onChange?.([...selectedValues, String(option.value)]);
    setSearch("");
  };

  const removeOption = (optionValue) => {
    onChange?.(
      selectedValues.filter((id) => id !== String(optionValue))
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-2 ${className}`}
    >
      {label && (
        <label className="text-sm font-medium text-cm-text">
          {label}
        </label>
      )}

      {/* Selected names */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-cm-blue-200 bg-cm-blue-50 py-1.5 pl-3 pr-1.5 text-sm text-cm-blue-800"
            >
              <span className="max-w-48 truncate">
                {option.label}
              </span>

              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${option.label}`}
                onClick={() => removeOption(option.value)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-cm-blue-100 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search and dropdown */}
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
        />

        <input
          type="text"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label || placeholder}
          aria-expanded={isOpen}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }

            if (
              event.key === "Enter" &&
              isOpen &&
              availableOptions.length > 0
            ) {
              event.preventDefault();
              addOption(availableOptions[0]);
            }
          }}
          className="h-11 w-full rounded-cm-md border border-cm-border bg-white py-2 pl-9 pr-10 text-sm text-cm-text outline-none transition focus:border-cm-blue-500 focus:ring-2 focus:ring-cm-blue-500/20 disabled:cursor-not-allowed disabled:bg-cm-bg"
        />

        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cm-text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-cm-md border border-cm-border bg-cm-card p-1 shadow-lg">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => addOption(option)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm text-cm-text transition-colors hover:bg-cm-bg"
                >
                  <span className="truncate">{option.label}</span>
                  <Check
                    size={16}
                    className="shrink-0 opacity-0"
                  />
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-cm-text-muted">
                {search.trim()
                  ? "No matching developers"
                  : selectedValues.length > 0
                    ? "All matching developers are selected"
                    : "No options available"}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-cm-text-muted">
        {selectedValues.length} selected
      </p>
    </div>
  );
}
