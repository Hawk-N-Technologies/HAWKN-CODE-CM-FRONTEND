import { useMemo } from "react";
import DOMPurify from "dompurify";

/**
 * Read-only view of rich text written with RichTextEditor.
 * HTML is cleaned with DOMPurify (no scripts, no event handlers) before it's
 * shown, and links open safely in a new tab. Same typography as the editor.
 */
export default function RichTextView({ html, className = "" }) {
  const clean = useMemo(() => {
    const safe = DOMPurify.sanitize(String(html || ""), { USE_PROFILES: { html: true } });
    // Open links in a new tab without giving the new page access to this one
    return safe.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
  }, [html]);

  return (
    <>
      <div className={`rte-view max-w-none break-words ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />
      <style>{`
        .rte-view h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.25; margin: 1.25rem 0 0.75rem; color: #111827; }
        .rte-view h2 { font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin: 1.25rem 0 0.6rem; color: #111827; }
        .rte-view h3 { font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin: 1rem 0 0.5rem; color: #111827; }
        .rte-view p { margin: 0 0 0.75rem; line-height: 1.7; color: #374151; }
        .rte-view ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
        .rte-view ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
        .rte-view li { margin-bottom: 0.25rem; color: #374151; line-height: 1.7; }
        .rte-view blockquote { border-left: 4px solid #c7d2fe; padding-left: 1rem; margin: 1rem 0; color: #4b5563; font-style: italic; }
        .rte-view code { background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.35rem; font-family: ui-monospace, monospace; font-size: 0.875em; }
        .rte-view pre { background: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .rte-view pre code { background: transparent; color: inherit; padding: 0; }
        .rte-view a { color: #4f46e5; text-decoration: underline; }
        .rte-view img { max-width: 100%; height: auto; border-radius: 6px; margin: 1rem 0; }
        .rte-view hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
        .rte-view mark { border-radius: 2px; padding: 0 2px; background-color: #fef08a; }
      `}</style>
    </>
  );
}
