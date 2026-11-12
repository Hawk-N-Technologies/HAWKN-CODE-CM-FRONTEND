import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Access the current auth session and login/logout actions.
 * Must be used inside <AuthProvider> (mounted in main.jsx).
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default useAuth;