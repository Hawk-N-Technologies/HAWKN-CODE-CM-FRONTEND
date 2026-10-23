import { useId } from "react";

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
  const autoId = useId();
  const fieldId = name || autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-cm-text">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full resize-y rounded-cm-md border bg-white px-3 py-2.5 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted focus:ring-2
          ${
          error
              ? "border-cm-danger-600 focus:border-cm-danger-600 focus:ring-cm-danger-600/20"
              : "border-cm-border focus:border-cm-focus focus:ring-cm-focus/20"
          }
          ${disabled ? "cursor-not-allowed bg-cm-bg opacity-60" : ""}
        `}
      />

      {error && <p id={errorId} className="text-sm text-cm-danger-600">{error}</p>}
    </div>
  );
}

export default Textarea;
