import axios from "axios";

/**
 * Client → Dashboard (read-only).
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const config = { withCredentials: true };

// { summary: { total, active, completed }, projects: [...] } for the logged-in client
export async function getClientProjects() {
  const res = await axios.get("/api/client/projects", config);
  return res.data.data;
}

// Any axios error → a message a human can read
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.status === 401) return "Your session has expired. Please log in again.";
  if (error?.response?.status === 403) return "You don't have permission to view this.";
  return error?.response?.data?.message || fallback;
}