import axios from "axios";

/**
 * All Employee Onboarding API calls in one place.
 * Pages call these functions — they never build URLs themselves.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/onboarding";
const config = { withCredentials: true };

// Roles HR can onboard into (admin + client are excluded by the backend)
export async function getOnboardableRoles() {
  const res = await axios.get(`${BASE}/roles`, config);
  return res.data.data;
}

export async function getOnboardingRecords() {
  const res = await axios.get(BASE, config);
  return res.data.data;
}

// Creates the user + employee + onboarding checklist in one go
export async function startOnboarding(payload) {
  const res = await axios.post(BASE, payload, config);
  return res.data.data;
}

// Tick / untick one checklist step
export async function updateChecklistItem(uuid, item, done) {
  const res = await axios.patch(`${BASE}/${uuid}/checklist`, { item, done }, config);
  return res.data.data;
}

export async function cancelOnboarding(uuid) {
  await axios.delete(`${BASE}/${uuid}`, config);
}

// Turns any axios error into a message a human can read
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.status === 401) return "Your session has expired. Please log in again.";
  if (error?.response?.status === 403) return "You don't have permission to do this.";
  return error?.response?.data?.message || fallback;
}

// Field-level errors from the backend, e.g. { email: "Already exists" }
export function getFieldErrors(error) {
  return error?.response?.data?.details || null;
}