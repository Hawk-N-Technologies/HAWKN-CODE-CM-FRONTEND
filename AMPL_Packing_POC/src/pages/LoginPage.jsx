import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import { homeFor } from "../auth/roles";
import { useAuth } from "../auth/useAuth";

const MESSAGES = {
  INVALID_CREDENTIALS: "Wrong username or password.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a minute and try again.",
  NETWORK_ERROR: "No connection to the server. Check your network.",
  BACKEND_UNREACHABLE: "The server is not responding. Try again shortly.",
};

function safeTarget(from) {
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && from !== "/login"
    ? from
    : null;
}

export default function LoginPage() {
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return <PageMessage title="Loading…" />;
  if (status === "authenticated") {
    return <Navigate to={safeTarget(location.state?.from) || homeFor(user.role)} replace />;
  }

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const loggedIn = await login(form.username.trim(), form.password);
      navigate(safeTarget(location.state?.from) || homeFor(loggedIn.role), { replace: true });
    } catch (err) {
      setError(MESSAGES[err.code] || err.message || "Login failed.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-cm-navy-950">Sign in</h1>
      <p className="mt-1 text-cm-text-muted">AMPL Packing · Hawk N Technologies</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            value={form.username}
            onChange={update("username")}
            className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card px-4 text-base"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={update("password")}
            className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card px-4 text-base"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-cm-md bg-cm-danger-100 px-4 py-3 text-sm font-medium text-cm-danger-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-cm-lg bg-cm-blue-600 font-semibold text-white shadow-cm-sm hover:bg-cm-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
