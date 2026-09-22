import { forwardRef, useId, useState } from "react";

/**
 * Reusable Input.
 *
 * Designed to work directly with react-hook-form's `register()`:
 *   <Input label="Email" {...register("email", { required: true })} error={errors.email?.message} />
 *
 * Forwards its ref so RHF can attach to the underlying <input>.
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = "text",
    placeholder,
    error,
    helperText,
    required = false,
    disabled = false,
    readOnly = false,
    multiline = false,
    rows = 4,
    className = "",
    containerClassName = "",
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || name || autoId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const fieldClassName = [
    "w-full rounded-cm-md border bg-white px-3 text-sm text-cm-text",
    "placeholder:text-cm-text-muted",
    "transition-colors duration-150",
    "focus:outline-none focus:ring-2 focus:ring-cm-blue-500 focus:border-cm-blue-500",
    "disabled:cursor-not-allowed disabled:bg-cm-bg disabled:text-cm-text-muted",
    "read-only:bg-cm-bg",
    error ? "border-cm-danger-600" : "border-cm-border",
    multiline ? "py-2 resize-y" : "h-10",
    isPassword ? "pr-10" : "",
    className,
  ].join(" ");

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-cm-text"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-cm-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {multiline ? (
          <textarea
            ref={ref}
            id={inputId}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            rows={rows}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={fieldClassName}
            {...rest}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={resolvedType}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={fieldClassName}
            {...rest}
          />
        )}

        {isPassword && !multiline && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-cm-text-muted hover:text-cm-text"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.24A9.9 9.9 0 0 1 12 4c5 0 9 4 10 8a11.6 11.6 0 0 1-2.1 3.4M6.6 6.6C4.5 8 3 10 2 12c1 4 5 8 10 8 1.3 0 2.6-.25 3.7-.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </div>

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

export default Input;