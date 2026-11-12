import axios from "axios";

/**
 * Internship / Probation API calls.
 * Error helpers (getErrorMessage / getFieldErrors) are shared from payrollService.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/internship-probation";
const config = { withCredentials: true };

// All periods (active first). Filtering by type/status happens on the page.
export async function getPeriods() {
  const res = await axios.get(BASE, config);
  return res.data.data;
}

// Start an internship / probation — also sets the employee's employment type
export async function createPeriod(payload) {
  const res = await axios.post(BASE, payload, config);
  return res.data;
}

// Update performance / notes / stipend
export async function reviewPeriod(uuid, payload) {
  const res = await axios.patch(`${BASE}/${uuid}/review`, payload, config);
  return res.data;
}

// Move the end date later
export async function extendPeriod(uuid, payload) {
  const res = await axios.post(`${BASE}/${uuid}/extend`, payload, config);
  return res.data;
}

// outcome: "Confirmed" | "Converted" | "Ended" | "Terminated"
export async function closePeriod(uuid, payload) {
  const res = await axios.post(`${BASE}/${uuid}/close`, payload, config);
  return res.data;
}