/**
 * Search box for tables. Controlled input — the parent owns the query
 * state and does the filtering, so this component stays dumb/reusable.
 */
function TableSearch({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="w-full max-w-xs">
      <label className="mb-1.5 block text-sm font-medium text-transparent">
        Search
      </label>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m20 20-3.5-3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search table"
          className="h-10 w-full rounded-cm-md border border-cm-border bg-white pl-9 pr-3 text-sm text-cm-text placeholder:text-cm-text-muted focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
        />
      </div>
    </div>
  );
}

export default TableSearch;
