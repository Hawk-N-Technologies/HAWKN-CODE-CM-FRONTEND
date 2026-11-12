import { forwardRef, useId } from "react";

const TextArea = forwardRef(function TextArea(
  {
    label,
    name,
    value,
    onChange,
    placeholder = "",
    rows = 4,
    required = false,
    disabled = false,
    error = "",
    helperText = "",
    className = "",
    ...props
  },
  ref,
) {
  const autoId = useId();
  const fieldId = name || autoId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-cm-text">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...props}
        className={`w-full resize-y rounded-cm-md border bg-white px-3 py-2.5 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted focus:ring-2
          ${
            error
              ? "border-cm-danger-600 focus:border-cm-danger-600 focus:ring-cm-danger-600/20"
              : "border-cm-border focus:border-cm-focus focus:ring-cm-focus/20"
          }
          ${disabled ? "cursor-not-allowed bg-cm-bg opacity-60" : ""}
        `}
      />

      {error ? (
        <p id={errorId} className="text-sm text-cm-danger-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-cm-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default TextArea;
