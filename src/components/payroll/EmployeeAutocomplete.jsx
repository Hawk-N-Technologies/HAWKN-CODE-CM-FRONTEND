import { useEffect, useId, useRef, useState } from "react";
import { searchPayrollEmployees } from "../../services/payrollService";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

// "project_lead" → "Project Lead"
const formatRole = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Google-style prediction: what you typed stays normal,
 * the predicted rest of the name is bold. "jo" → jo**hn Doe**
 */
function PredictedName({ fullName, typed }) {
  const startsWithTyped = fullName.toLowerCase().startsWith(typed.toLowerCase());
  if (!startsWithTyped) return <span className="font-semibold">{fullName}</span>;

  return (
    <span>
      {fullName.slice(0, typed.length)}
      <span className="font-semibold">{fullName.slice(typed.length)}</span>
    </span>
  );
}

/**
 * Search-as-you-type employee picker (a "combobox").
 *
 * - Waits 300 ms after the last keystroke, then asks the backend.
 * - Older, slower responses are cancelled so they can't overwrite newer ones.
 * - Picking a suggestion gives the parent the exact employee (by UUID).
 * - Keyboard: ↑ ↓ to move, Enter to pick, Esc to close.
 *
 * props:
 *   selected  — { uuid, fullName, email } | null
 *   onSelect  — (employee | null) => void   (null = selection cleared)
 *   onTextChange — (text) => void (optional) lets the parent spot
 *                  "typed a name but never picked a suggestion"
 */
function EmployeeAutocomplete({
  selected,
  onSelect,
  onTextChange,
  label,
  placeholder = "Search employee by name…",
  error,
  required = false,
  className = "",
  inputClassName = "",
}) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [text, setText] = useState(selected?.fullName ?? "");
  // Results remember which query they belong to → loading is derived, not stored
  const [results, setResults] = useState({ query: "", items: [], failed: false });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef(null);

  // Parent cleared the selection (e.g. "Clear filters") → clear the box too
  const [lastSelected, setLastSelected] = useState(selected);
  if (selected !== lastSelected) {
    setLastSelected(selected);
    setText(selected?.fullName ?? "");
  }

  const query = text.trim();
  const isSearchable = query.length >= MIN_CHARS && !selected;

  // Debounced fetch — state is only set inside the timer/response callbacks
  useEffect(() => {
    if (!isSearchable) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPayrollEmployees(query, controller.signal)
        .then((items) => setResults({ query, items, failed: false }))
        .catch((err) => {
          if (err?.name === "CanceledError") return; // outdated request, ignore
          setResults({ query, items: [], failed: true });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isSearchable]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const isLoading = isSearchable && results.query !== query;
  const suggestions = isSearchable && !isLoading ? results.items : [];
  const showList = isOpen && isSearchable;

  // Keep the box text and the parent in sync
  const updateText = (value) => {
    setText(value);
    onTextChange?.(value);
  };

  const pick = (employee) => {
    onSelect(employee);
    updateText(employee.fullName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (event) => {
    updateText(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
    // Typing again means the old pick no longer applies
    if (selected) onSelect(null);
  };

  const handleKeyDown = (event) => {
    if (!showList || suggestions.length === 0) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault(); // don't submit the form — pick the suggestion
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const clear = () => {
    updateText("");
    onSelect(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-cm-text">
          {label}
          {required && (
            <span className="ml-0.5 text-cm-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={Boolean(error) || undefined}
          value={text}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          // Small delay so a click on a suggestion lands before the list closes
          onBlur={() => {
            blurTimer.current = setTimeout(() => setIsOpen(false), 150);
          }}
          className={[
            "h-10 w-full rounded-cm-md border bg-white px-3 pr-8 text-sm text-cm-text",
            "placeholder:text-cm-text-muted focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500",
            error ? "border-cm-danger-600" : "border-cm-border",
            inputClassName,
          ].join(" ")}
        />
        {text && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear employee"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-cm-text-muted hover:text-cm-text"
          >
            ×
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-cm-md border border-cm-border bg-white py-1 shadow-lg"
        >
          {isLoading && <li className="px-3 py-2 text-sm text-cm-text-muted">Searching…</li>}

          {!isLoading && results.failed && (
            <li className="px-3 py-2 text-sm text-cm-danger-600">Couldn't load suggestions.</li>
          )}

          {!isLoading && !results.failed && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-cm-text-muted">No matching employees.</li>
          )}

          {suggestions.map((employee, index) => (
            <li
              key={employee.uuid}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown (not click) fires before the input's blur
              onMouseDown={(event) => {
                event.preventDefault();
                pick(employee);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? "bg-cm-bg" : ""}`}
            >
              <div className="text-cm-text">
                <PredictedName fullName={employee.fullName} typed={query} />
              </div>
              <div className="text-xs text-cm-text-muted">
                {employee.email} · {formatRole(employee.role)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {query.length > 0 && query.length < MIN_CHARS && !selected && isOpen && (
        <p className="text-xs text-cm-text-muted">Type at least {MIN_CHARS} letters…</p>
      )}

      {error && <p className="text-sm text-cm-danger-600">{error}</p>}
    </div>
  );
}

export default EmployeeAutocomplete;