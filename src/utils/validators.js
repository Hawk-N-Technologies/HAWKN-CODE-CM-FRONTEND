/**
 * Shared react-hook-form validation rules.
 * Frontend validation is for UX only — the backend remains the
 * authoritative source of validation once it's wired up.
 */
export const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Enter a valid email address.",
};

export const required = (fieldLabel) => ({
  value: true,
  message: `${fieldLabel} is required.`,
});

export const minLength = (length, fieldLabel) => ({
  value: length,
  message: `${fieldLabel} must be at least ${length} characters.`,
});