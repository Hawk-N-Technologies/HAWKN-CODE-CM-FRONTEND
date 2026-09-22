import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Compass } from "lucide-react";
import Button from "../components/common/Button";
import logo from "../assets/hawkn-logo.png";

/**
 * Catch-all route (see routes/AppRoutes.jsx "*" route).
 */
function NotFound() {
  const navigate = useNavigate();

  function handleGoHome() {
    navigate("/");
  }

  function handleGoBack() {
    navigate(-1);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#000052]/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#000052]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={logo}
            alt="Hawk'in Technologies"
            className="h-18 w-auto object-contain"
          />
        </div>

        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-12">
          <div className="relative mx-auto mb-5 w-fit">
            <div className="absolute inset-0 rounded-full bg-[#000052]/5 blur-2xl" />

            <p className="relative select-none text-[96px] font-black leading-none tracking-[-0.08em] text-[#000052] sm:text-[120px]">
              404
            </p>
          </div>

          <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-[#000052]" />

          <h1 className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085] sm:text-base">
            Sorry, we couldn't find the page you're looking for. It may have
            been moved, deleted, or the address may be incorrect.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              leftIcon={<Home size={17} />}
              onClick={handleGoHome}
            >
              Back to Home
            </Button>

            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={17} />}
              onClick={handleGoBack}
            >
              Go Back
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#98A2B3]">
          © {new Date().getFullYear()} Hawk'in Technologies. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}

export default NotFound;
