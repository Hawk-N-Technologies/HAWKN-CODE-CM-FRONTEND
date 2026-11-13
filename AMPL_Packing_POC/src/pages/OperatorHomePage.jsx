import { useAuth } from "../auth/useAuth";

/**
 * Operator landing page: shows the sections this operator may pack in.
 * Becomes the section picker for the packing screen in M4.
 */
export default function OperatorHomePage() {
  const { user } = useAuth();
  const sections = user.sections || [];

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold text-cm-navy-950">Hello, {user.display_name}</h1>
      <p className="mt-1 text-cm-text-muted">Your packing sections</p>

      {sections.length === 0 ? (
        <p className="mt-6 rounded-cm-lg bg-cm-warning-100 px-4 py-3 font-medium text-cm-warning-600">
          You are not assigned to any packing section yet. Ask an admin.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {sections.map((section) => (
            <li
              key={section.id}
              className="rounded-cm-xl border border-cm-border bg-cm-card px-5 py-4 shadow-cm-sm"
            >
              <p className="text-lg font-semibold">
                {section.code} — {section.name}
              </p>
              <p className="text-sm text-cm-text-muted">
                {section.active_config
                  ? `Box configuration: ${section.active_config}`
                  : "No box configuration assigned"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-cm-text-muted">The packing screen is added in the next update (M4).</p>
    </main>
  );
}
