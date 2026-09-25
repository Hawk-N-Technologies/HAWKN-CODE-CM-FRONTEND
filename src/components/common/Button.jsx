import { forwardRef } from "react";

/**
 * Reusable Button.
 *
 * variant: "primary" | "secondary" | "outline" | "ghost" | "danger"
 * size:    "sm" | "md" | "lg"
 *
 * `loading` disables the button and swaps its label for a spinner so a
 * user cannot trigger the same action twice while a request is in flight.
 */

const VARIANT_CLASSES = {
  primary:
    "bg-[#000052] text-[#FFFFFF] hover:bg-[#00003D] focus-visible:outline-[#000052] disabled:bg-[#000052]/50",

  secondary:
    "bg-[#F1F4FF] text-[#000052] hover:bg-[#E5E9FF] focus-visible:outline-[#000052] disabled:bg-[#F1F4FF]/50",

  outline:
    "border border-[#D9DDEB] bg-white text-[#000052] hover:bg-[#F7F8FC] hover:border-[#000052]/30 focus-visible:outline-[#000052] disabled:text-[#98A2B3]",

  ghost:
    "bg-transparent text-[#000052] hover:bg-[#F1F4FF] focus-visible:outline-[#000052] disabled:text-[#98A2B3]",

  danger:
    "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:outline-[#DC2626] disabled:bg-[#DC2626]/50",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

function Spinner({ size }) {
  const dim =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <svg
      className={`${dim} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    type = "button",
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon = null,
    rightIcon = null,
    className = "",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center rounded-cm-md font-semibold",
        "transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={size} />
          <span>Please wait…</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
});

export default Button;
