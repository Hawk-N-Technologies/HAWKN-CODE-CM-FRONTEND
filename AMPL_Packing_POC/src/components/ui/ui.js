// Shared class names so every admin screen looks the same.
export const btnPrimary =
  "inline-flex h-10 items-center justify-center rounded-cm-md bg-cm-blue-600 px-4 text-sm font-semibold text-white hover:bg-cm-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex h-10 items-center justify-center rounded-cm-md border border-cm-border bg-cm-card px-4 text-sm font-semibold text-cm-navy-950 hover:bg-cm-blue-50 disabled:opacity-50";
export const btnDanger =
  "inline-flex h-10 items-center justify-center rounded-cm-md border border-cm-danger-600 px-4 text-sm font-semibold text-cm-danger-600 hover:bg-cm-danger-100 disabled:opacity-50";
export const input = "h-10 w-full rounded-cm-md border border-cm-border bg-white px-3 text-sm";
export const label = "mb-1 block text-sm font-medium";
export const card = "rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm";

/** Turn an ApiError into one readable line (includes field errors). */
export function errorText(error) {
  if (!error) return "";
  const fields = (error.errors || []).map((item) => `${item.field}: ${item.message}`);
  return fields.length ? `${error.message} ${fields.join(" · ")}` : error.message;
}
