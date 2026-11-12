/**
 * Reusable "nothing here yet" state for tables/lists/panels.
 */
function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-sm font-medium text-cm-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-cm-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;