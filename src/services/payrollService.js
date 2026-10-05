import axios from "axios";

/**
 * All Payroll API calls in one place.
 * Pages call these functions — they never build URLs themselves.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/payroll";
const config = { withCredentials: true };

// Name autocomplete. `signal` lets the caller cancel an outdated request.
export async function searchPayrollEmployees(q, signal) {
  const res = await axios.get(`${BASE}/employees/search`, {
    ...config,
    params: { q },
    signal,
  });
  return res.data.data;
}

// filters: { startDate?, endDate?, userUuid?, status? } — empty ones are skipped
export async function getPayroll(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
  const res = await axios.get(BASE, { ...config, params });
  return res.data.data;
}

export async function createPayroll(payload) {
  const res = await axios.post(BASE, payload, config);
  return res.data.data;
}

// Edit a Pending payroll — amounts + payment method only
export async function updatePayroll(uuid, payload) {
  const res = await axios.put(`${BASE}/${uuid}`, payload, config);
  return res.data.data;
}

// Delete a Pending payroll
export async function deletePayroll(uuid) {
  await axios.delete(`${BASE}/${uuid}`, config);
}

export async function processPayroll(uuid) {
  const res = await axios.patch(`${BASE}/${uuid}/process`, {}, config);
  return res.data.data;
}

// ---------- Salary Structure ----------

// Autocomplete that only returns people with an employee record
export async function searchSalaryEmployees(q, signal) {
  const res = await axios.get(`${BASE}/salaries/employees/search`, {
    ...config,
    params: { q },
    signal,
  });
  return res.data.data;
}

// Optional userUuid = one exact employee
export async function getSalaries(userUuid) {
  const res = await axios.get(`${BASE}/salaries`, {
    ...config,
    params: userUuid ? { userUuid } : {},
  });
  return res.data.data;
}

// Creates the salary the first time, updates it after
export async function setSalary(userUuid, salary) {
  const res = await axios.put(`${BASE}/salaries`, { userUuid, salary }, config);
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