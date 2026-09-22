import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "../../constants/roles";
import { EMAIL_PATTERN, required } from "../../utils/validators";
import logo from "../../assets/hawkn-logo.jpeg";

/**
 * Single login page for every role. After authenticating, the user is
 * routed to their role's dashboard (see ROLE_DASHBOARD_PATH) — there
 * are no separate per-role login screens.
 */
function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticating } = useAuth();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async ({ email, password }) => {
    setFormError(null);
    try {
      const user = await login({ email, password });
      showToast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      navigate(ROLE_DASHBOARD_PATH[user.role] ?? "/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setFormError(message);
      showToast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-cm-bg">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-cm-navy-950 p-12 text-cm-text-inverse lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-cm-navy-900 via-cm-navy-950 to-cm-navy-950" />
        <div className="relative">
          <img src={logo} alt="Hawk'N Technologies" className="h-10 w-auto rounded bg-white/5 p-1" />
        </div>
        <div className="relative max-w-sm">
          <h1 className="text-3xl font-bold leading-tight">
            One platform for the whole company.
          </h1>
          <p className="mt-4 text-sm text-cm-text-inverse/70">
            Company profile, HRMS, clients, projects, development, testing and
            delivery — all in a single, role-aware workspace.
          </p>
        </div>
        <p className="relative text-xs text-cm-text-inverse/50">
          © {new Date().getFullYear()} Hawk'N Technologies. Internal use only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4 lg:items-start">
            <img src={logo} alt="Hawk'N Technologies" className="h-9 w-auto lg:hidden" />
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-cm-text">Sign in</h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                Enter your company credentials to continue.
              </p>
            </div>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
          >
            {formError && (
              <p
                role="alert"
                className="rounded-cm-md border border-cm-danger-100 bg-cm-danger-100 px-3 py-2 text-sm text-cm-danger-600"
              >
                {formError}
              </p>
            )}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register("email", {
                required: required("Email"),
                pattern: EMAIL_PATTERN,
              })}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", {
                required: required("Password"),
              })}
            />

            <Button type="submit" fullWidth loading={isAuthenticating}>
              Sign in
            </Button>
          </form>

          <details className="mt-6 rounded-cm-md border border-cm-border bg-white p-3 text-xs text-cm-text-muted">
            <summary className="cursor-pointer select-none font-medium text-cm-text">
              Demo accounts (dev build only)
            </summary>
            <ul className="mt-2 space-y-1">
              <li>admin@cm.dev / Admin@123</li>
              <li>hr@cm.dev / Hr@12345</li>
              <li>bd@cm.dev / Bd@12345</li>
              <li>lead@cm.dev / Lead@123</li>
              <li>dev@cm.dev / Dev@1234</li>
              <li>tester@cm.dev / Test@123</li>
              <li>client@cm.dev / Client@12</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}

export default Login;