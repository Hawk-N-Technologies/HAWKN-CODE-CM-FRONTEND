/** Centered message for loading / error states. */
export default function PageMessage({ title, children, tone = "neutral" }) {
  const toneClass = tone === "error" ? "text-cm-danger-600" : "text-cm-navy-950";
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className={`text-xl font-semibold ${toneClass}`}>{title}</h1>
      {children && <div className="mt-3 text-cm-text-muted">{children}</div>}
    </main>
  );
}
