import { Link } from "react-router-dom";

/**
 * Catch-all route (see routes/AppRoutes.jsx "*" route).
 * Not tied to any role, so it lives directly under src/pages, not
 * under any of the role subfolders.
 */
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cm-bg px-6 text-center">
      <p className="text-sm font-semibold text-cm-blue-600">404</p>
      <h1 className="text-2xl font-bold text-cm-text">Page not found</h1>
      <p className="max-w-sm text-sm text-cm-text-muted">
        The page you're looking for doesn't exist or you don't have access to it.
      </p>
      <Link
        to="/login"
        className="mt-2 rounded-cm-md bg-cm-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cm-blue-700"
      >
        Back to login
      </Link>
    </div>
  );
}

export default NotFound;