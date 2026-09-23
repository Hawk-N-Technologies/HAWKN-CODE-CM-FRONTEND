import Button from "./Button";

/**
 * Reusable "something went wrong" state for tables/lists/panels that
 * do a real fetch (unlike EmptyState, which is for a successful fetch
 * that just has no rows).
 */
function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-sm font-medium text-cm-danger-600">{title}</p>
      {description && <p className="max-w-xs text-sm text-cm-text-muted">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorState;