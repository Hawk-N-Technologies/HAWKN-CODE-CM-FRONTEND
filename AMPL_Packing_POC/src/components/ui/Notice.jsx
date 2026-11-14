/** Success / error line shown after an admin action. */
export default function Notice({ notice, onClose }) {
  if (!notice) return null;
  const tone = notice.ok
    ? "bg-cm-success-100 text-cm-success-600"
    : "bg-cm-danger-100 text-cm-danger-600";
  return (
    <div role={notice.ok ? "status" : "alert"} className={`flex items-start justify-between gap-3 rounded-cm-md px-4 py-3 text-sm font-medium ${tone}`}>
      <span>{notice.text}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="font-bold">×</button>
      )}
    </div>
  );
}
