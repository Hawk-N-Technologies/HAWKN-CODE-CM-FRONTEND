/**
 * Single place for talking to the AMPL backend.
 *
 * - Same-origin requests to /api/v1 (the dev server / nginx forwards them).
 * - Sends the session cookie automatically.
 * - Adds the CSRF header on write requests.
 * - Turns every failure into an ApiError with a stable `code`.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");
const CSRF_COOKIE = "ampl_csrftoken";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Fired when the server says "not logged in" (e.g. the session expired during a
// shift). AuthProvider listens and sends the user to the sign-in page.
export const SESSION_EXPIRED_EVENT = "ampl:session-expired";

export class ApiError extends Error {
  constructor({ status, code, message, errors = [], data = null }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }
}

function readCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * full: true returns the whole response ({data, pagination, message}) instead of only `data`.
 */
export async function apiRequest(path, { method = "GET", body, signal, full = false } = {}) {
  const upperMethod = method.toUpperCase();
  const headers = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (UNSAFE_METHODS.has(upperMethod)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers["X-CSRFToken"] = token;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: upperMethod,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Cannot reach the server. Check your connection.",
    });
  }

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (response.ok && payload?.success !== false) {
    if (full) return payload;
    return payload?.data ?? payload;
  }

  if (response.status === 401 && !path.startsWith("/auth/")) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }

  if (!payload) {
    // Usually the dev server could not reach the backend (502/504).
    throw new ApiError({
      status: response.status,
      code: "BACKEND_UNREACHABLE",
      message: "The AMPL backend is not responding.",
    });
  }

  throw new ApiError({
    status: response.status,
    code: payload.code || "ERROR",
    message: payload.message || "Request failed.",
    errors: payload.errors || [],
    data: payload.data ?? null,
  });
}
