import axios from "axios";

/**
 * Admin → Deployment Planning API calls.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/admin/deployments";
const config = { withCredentials: true };

// Every project + its deployment plan + readiness
export async function getDeploymentProjects() {
  const res = await axios.get(`${BASE}/projects`, config);
  return res.data.data;
}

// One project's plan (defaults if nothing saved yet)
export async function getDeploymentPlan(projectUuid) {
  const res = await axios.get(`${BASE}/projects/${projectUuid}`, config);
  return res.data.data;
}

// Create the plan the first time, update it after
export async function saveDeploymentPlan(projectUuid, payload) {
  const res = await axios.put(`${BASE}/projects/${projectUuid}`, payload, config);
  return res.data;
}

// Any axios error → a message a human can read
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.status === 401) return "Your session has expired. Please log in again.";
  if (error?.response?.status === 403) return "You don't have permission to do this.";
  return error?.response?.data?.message || fallback;
}

// Backend validation errors [{ field, message }] → { field: message }
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return null;
  return Object.fromEntries(list.filter((e) => e.field).map((e) => [e.field, e.message]));
}