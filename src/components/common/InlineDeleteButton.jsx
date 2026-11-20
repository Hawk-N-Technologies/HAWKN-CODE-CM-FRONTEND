import Button from "./Button";

/**
 * The app's one delete pattern — two clicks, inline, no pop-up:
 *   [Delete]  →  [Keep] [Confirm delete?]
 * The page keeps which row is confirming (e.g. confirmDeleteUuid).
 */
export default function InlineDeleteButton({
  isConfirming,
  loading = false,
  disabled = false,
  onDelete,
  onKeep,
  size = "sm",
  label = "Delete",
}) {
  return (
    <>
      {isConfirming && !loading && (
        <Button type="button" size={size} variant="ghost" onClick={onKeep}>
          Keep
        </Button>
      )}
      <Button
        type="button"
        size={size}
        variant="danger"
        loading={loading}
        disabled={disabled}
        onClick={onDelete}
      >
        {isConfirming ? "Confirm delete?" : label}
      </Button>
    </>
  );
}
