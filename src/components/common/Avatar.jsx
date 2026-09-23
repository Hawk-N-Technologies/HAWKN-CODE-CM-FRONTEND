/**
 * Circular initials avatar (no photo upload yet). Same initials-from-name
 * logic as TopNavbar's own avatar, pulled out here so any table/card can
 * reuse it instead of recomputing initials locally.
 */
const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function Avatar({ name = "?", size = "md" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-cm-blue-100 font-semibold text-cm-blue-700 ${SIZE_CLASSES[size]}`}
    >
      {initials}
    </span>
  );
}

export default Avatar;