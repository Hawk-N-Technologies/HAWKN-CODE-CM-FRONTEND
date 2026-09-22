import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DASHBOARD_PATH } from "../../constants/roles";
import { EMAIL_PATTERN, required } from "../../utils/validators";

import logo from "../../assets/hawkn-logo.png";
import logo2 from "../../assets/hawkn-logo-2.png";

/**
 * Single login page for every role.
 *
 * After authenticating, the user is routed to their role's dashboard.
 */
function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticating } = useAuth();

  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit({ email, password }) {
    setFormError(null);

    try {
      const user = await login({
        email,
        password,
      });

      showToast.success(`Welcome back, ${user.name.split(" ")[0]}.`);

      navigate(ROLE_DASHBOARD_PATH[user.role] ?? "/", {
        replace: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";

      setFormError(message);
      showToast.error(message);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* =========================================================
          LEFT BRAND PANEL
      ========================================================= */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#000052] text-white lg:flex">
        {/* Subtle navy gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#000052] via-[#000052] to-[#00003A]" />

        {/* Decorative circles */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full border border-white/[0.04]" />

        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border border-white/[0.04]" />

        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full border border-white/[0.05]" />

        <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-white/[0.025] blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div>
            <img
              src={logo2}
              alt="Hawk'N Technologies"
              className="h-14 w-auto rounded-lg object-contain"
            />
          </div>

          {/* Center content */}
          <div className="max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-white" />

              <span className="text-xs font-semibold tracking-wide text-white/80">
                COMPANY WORKSPACE
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
              One platform for
              <span className="block text-white/80">the whole company.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
              Company profile, HRMS, clients, projects, development, testing and
              delivery — all in a single, role-aware workspace.
            </p>

            {/* Feature highlights */}
            <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck size={19} className="text-white" />
                </div>

                <p className="text-sm font-semibold text-white">Secure</p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Protected company access.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <LockKeyhole size={19} className="text-white" />
                </div>

                <p className="text-sm font-semibold text-white">Role based</p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Access based on your role.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Hawk'N Technologies
            </p>

            <p className="text-xs text-white/30">Internal use only</p>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT LOGIN PANEL
      ========================================================= */}
      <div className="flex w-full items-center justify-center bg-[#F8F9FC] px-5 py-10 sm:px-8 lg:w-1/2 lg:bg-white lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src={logo}
              alt="Hawk'N Technologies"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Header */}
          <div className="mb-7">
            <div className="mb-4 h-1 w-10 rounded-full bg-[#000052]" />

            <h2 className="text-3xl font-bold tracking-tight text-[#101828]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Sign in with your company credentials to continue.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <form
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Error */}
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {formError}
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              <div className="relative">
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

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[36px] flex h-8 w-8 items-center justify-center rounded-lg text-[#98A2B3] transition hover:bg-[#F2F4F7] hover:text-[#000052] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000052]/30"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#D0D5DD] accent-[#000052] focus:ring-[#000052]/30"
                  />

                  <span className="text-xs font-medium text-[#667085]">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    showToast.info(
                      "Please contact your administrator to reset your password.",
                    );
                  }}
                  className="text-xs font-semibold text-[#000052] transition hover:text-[#00003D]"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isAuthenticating}
                rightIcon={!isAuthenticating ? <ArrowRight size={17} /> : null}
              >
                Sign in
              </Button>
            </form>

            {/* Security message */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#EEF0F4] pt-5">
              <ShieldCheck size={15} className="text-[#000052]" />

              <p className="text-xs text-[#98A2B3]">
                Secure company account access
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <details className="mt-5 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-xs font-semibold text-[#475467] transition hover:bg-[#F8F9FC]">
              Demo accounts
              <span className="ml-1 font-normal text-[#98A2B3]">
                · development only
              </span>
            </summary>

            <div className="border-t border-[#EEF0F4] px-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Admin
                  </span>

                  <span className="text-xs text-[#667085]">admin@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">HR</span>

                  <span className="text-xs text-[#667085]">hr@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Business Development
                  </span>

                  <span className="text-xs text-[#667085]">bd@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Lead
                  </span>

                  <span className="text-xs text-[#667085]">lead@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Developer
                  </span>

                  <span className="text-xs text-[#667085]">dev@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Tester
                  </span>

                  <span className="text-xs text-[#667085]">tester@cm.dev</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#F8F9FC] px-3 py-2">
                  <span className="text-xs font-medium text-[#475467]">
                    Client
                  </span>

                  <span className="text-xs text-[#667085]">client@cm.dev</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-[#98A2B3]">
                Demo accounts are available in the development environment only.
              </p>
            </div>
          </details>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[#98A2B3] lg:hidden">
            © {new Date().getFullYear()} Hawk'N Technologies
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
