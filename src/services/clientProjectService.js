import axios from "axios";

/**
 * Client dashboard (read-only).
 * Sends the HttpOnly login cookie with every request.
 */
const config = { withCredentials: true };

// Projects belonging to the authenticated client.
export async function getClientProjects() {
  const res = await axios.get("/api/client/projects", config);
  return res.data.data;
}

// Project modules, phases, tasks, and progress.
export async function getClientProjectPhases(projectUuid) {
  const res = await axios.get(
    `/api/client/projects/${encodeURIComponent(projectUuid)}/phases`,
    config,
  );

  return res.data.data;
}

export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You don't have permission to view this.";
  }

  return error?.response?.data?.message || fallback;
}