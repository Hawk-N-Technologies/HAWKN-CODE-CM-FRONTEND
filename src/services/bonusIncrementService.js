import axios from "axios";

/**
 * Bonuses & Increments API calls.
 * Error helpers (getErrorMessage / getFieldErrors) are shared from payrollService.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const config = { withCredentials: true };

// ---------- Bonuses ----------

export async function getBonuses(userUuid) {
  const res = await axios.get("/api/bonuses", { ...config, params: userUuid ? { userUuid } : {} });
  return res.data.data;
}

export async function createBonus(payload) {
  const res = await axios.post("/api/bonuses", payload, config);
  return res.data.data;
}

export async function deleteBonus(uuid) {
  await axios.delete(`/api/bonuses/${uuid}`, config);
}

// Total bonus for one employee + month → { total, count } (payroll auto-fill)
export async function getBonusTotal(userUuid, payPeriod) {
  const res = await axios.get("/api/bonuses/total", { ...config, params: { userUuid, payPeriod } });
  return res.data.data;
}

// ---------- Increments ----------

export async function getIncrements(userUuid) {
  const res = await axios.get("/api/increments", { ...config, params: userUuid ? { userUuid } : {} });
  return res.data.data;
}

// Also updates the employee's salary in Salary Structure
export async function createIncrement(payload) {
  const res = await axios.post("/api/increments", payload, config);
  return res.data.data;
}

// Latest increment only — restores the previous salary
export async function revertIncrement(uuid) {
  await axios.delete(`/api/increments/${uuid}`, config);
}