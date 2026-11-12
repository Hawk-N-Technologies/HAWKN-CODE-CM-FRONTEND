import { ToastContainer, toast } from "react-toastify";

/**
 * Centralized React Toastify setup.
 *
 * Mount <ToastProvider /> once near the app root (see main.jsx).
 * Everywhere else, import { showToast } and call showToast.success(...) etc.
 * so every notification in the app shares the same position/timing/style
 * and no component reaches for react-toastify directly.
 */
export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
      toastClassName="!rounded-cm-md !text-sm"
    />
  );
}

const DEFAULT_OPTIONS = { autoClose: 4000 };

// eslint-disable-next-line react-refresh/only-export-components
export const showToast = {
  success: (message, options) => toast.success(message, { ...DEFAULT_OPTIONS, ...options }),
  error: (message, options) => toast.error(message, { ...DEFAULT_OPTIONS, ...options }),
  warning: (message, options) => toast.warning(message, { ...DEFAULT_OPTIONS, ...options }),
  info: (message, options) => toast.info(message, { ...DEFAULT_OPTIONS, ...options }),
};

export default ToastProvider;