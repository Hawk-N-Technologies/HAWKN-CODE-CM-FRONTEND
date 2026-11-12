import { useId, useRef, useState } from "react";

/**
 * Reusable file picker with client-side type/size validation.
 * Client-side validation is for UX only — the backend must
 * independently re-validate type, size, and content once uploads
 * actually go somewhere (see BRD File Upload Security).
 *
 * accept: e.g. "application/pdf,.doc,.docx"
 * onFileSelect(file | null)
 */
function FileUpload({
  label,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 10,
  onFileSelect,
  helperText,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB.`);
      setFileName(null);
      onFileSelect?.(null);
      event.target.value = "";
      return;
    }

    setError(null);
    setFileName(file.name);
    onFileSelect?.(file);
  };

  const handleRemove = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-cm-text">
          {label}
        </label>
      )}

      {fileName ? (
        <div className="flex items-center justify-between rounded-cm-md border border-cm-border bg-cm-bg px-3 py-2 text-sm text-cm-text">
          <span className="truncate">📎 {fileName}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-2 shrink-0 text-cm-text-muted hover:text-cm-danger-600"
            aria-label="Remove file"
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-center rounded-cm-md border border-dashed border-cm-border bg-cm-bg px-3 py-4 text-sm text-cm-text-muted hover:border-cm-blue-500 hover:text-cm-blue-600"
        >
          Click to choose a file
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      )}

      {error ? (
        <p className="text-sm text-cm-danger-600">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-cm-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}

export default FileUpload;