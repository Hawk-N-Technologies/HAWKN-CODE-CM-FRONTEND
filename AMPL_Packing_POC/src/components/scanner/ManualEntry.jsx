import { useState } from "react";

/**
 * Type a UID, or use a USB/Bluetooth barcode scanner (they "type" the code
 * and press Enter). Fallback when the camera is not available.
 */
export default function ManualEntry({
  onSubmit,
  disabled,
  placeholder = "Type or scan UID",
  inputMode = "numeric",
  label = "Type product UID",
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="manual-uid" className="sr-only">{label}</label>
      <input
        id="manual-uid"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        className="h-12 min-w-0 flex-1 rounded-cm-lg border border-cm-border bg-cm-card px-4 text-base"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-12 rounded-cm-lg bg-cm-navy-900 px-5 font-semibold text-white disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
