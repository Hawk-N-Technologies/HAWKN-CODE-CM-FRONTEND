import Swal from "sweetalert2";

const DEFAULT_OPTIONS = {
  confirmButtonColor: "#000052",
};

export const showAlert = {
  success: (title, text = "") => {
    return Swal.fire({
      icon: "success",
      title,
      text,
      ...DEFAULT_OPTIONS,
    });
  },

  error: (title, text = "") => {
    return Swal.fire({
      icon: "error",
      title,
      text,
      ...DEFAULT_OPTIONS,
    });
  },

  warning: (title, text = "") => {
    return Swal.fire({
      icon: "warning",
      title,
      text,
      ...DEFAULT_OPTIONS,
    });
  },

  confirm: ({
    title = "Are you sure?",
    text = "",
    confirmButtonText = "Yes",
    cancelButtonText = "Cancel",
  } = {}) => {
    return Swal.fire({
      icon: "warning",
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: "#000052",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });
  },
};

export default showAlert;
