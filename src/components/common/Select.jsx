import { forwardRef, useId } from "react";

/**
 * Reusable Select — same label/error/helper contract as Input, so a
 * form can mix Input and Select fields without inconsistent styling.
 * options: Array<{ value, label }>
 */
const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    options = [],
    placeholder = "Select…",
    error,
    helperText,
    required = false,
    disabled = false,
    className = "",
    containerClassName = "",
    ...rest
  },
  ref
) {
  const autoId = useId();
  const selectId = id || name || autoId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-cm-text">
          {label}
          {required && (
            <span className="ml-0.5 text-cm-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        name={name}
        disabled={disabled}
        required={required}
        defaultValue=""
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={[
          "h-10 w-full rounded-cm-md border bg-white px-3 text-sm text-cm-text",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-cm-blue-500 focus:border-cm-blue-500",
          "disabled:cursor-not-allowed disabled:bg-cm-bg disabled:text-cm-text-muted",
          error ? "border-cm-danger-600" : "border-cm-border",
          className,
        ].join(" ")}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={errorId} className="text-sm text-cm-danger-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-cm-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;