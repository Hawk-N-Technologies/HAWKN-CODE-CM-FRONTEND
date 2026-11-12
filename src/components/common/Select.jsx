import { forwardRef, useId } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

/**
 * Premium reusable Select
 *
 * options: Array<{ value, label }>
 * groups: Array<{ label, options: Array<{ value, label }> }>
 */
const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    options = [],
    groups = [],
    placeholder = "Select an option",
    error,
    helperText,
    required = false,
    disabled = false,
    className = "",
    containerClassName = "",
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id || name || autoId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="flex items-center gap-1 text-[13px] font-semibold tracking-[0.01em] text-cm-text"
        >
          {label}

          {required && (
            <span className="text-cm-danger-600" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Select field */}
      <div className="group relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={[
            // Layout
            "h-11 w-full appearance-none rounded-xl border",
            "pl-3.5 pr-10 text-sm font-medium",

            // Surface
            "bg-white text-cm-text",
            "shadow-sm shadow-black/[0.02]",

            // Interaction
            "transition-all duration-200 ease-out",
            "hover:border-cm-focus/50",
            "focus:border-cm-focus",
            "focus:outline-none focus:ring-4 focus:ring-cm-focus/10",

            // Disabled
            "disabled:cursor-not-allowed disabled:border-cm-border",
            "disabled:bg-cm-bg disabled:text-cm-text-muted",
            "disabled:shadow-none",

            // Validation
            error
              ? "border-cm-danger-600 bg-red-50/30 focus:border-cm-danger-600 focus:ring-cm-danger-600/10"
              : "border-cm-border",

            className,
          ].join(" ")}
          {...rest}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}

          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom dropdown icon */}
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute right-3.5 top-1/2",
            "-translate-y-1/2 transition-colors duration-200",
            error
              ? "text-cm-danger-600"
              : "text-cm-text-muted group-focus-within:text-cm-focus",
          ].join(" ")}
        >
          <ChevronDown size={17} strokeWidth={2} />
        </div>
      </div>

      {/* Helper / error message */}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-cm-danger-600"
        >
          <AlertCircle
            size={14}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs leading-relaxed text-cm-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
