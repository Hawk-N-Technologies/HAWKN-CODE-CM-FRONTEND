import axios from "axios";

/** SOPs API — everyone reads, Admin & HR write. */
const API = "/api/sops";
const config = { withCredentials: true };
const data = (res) => res.data.data;

export const SOP_DEPARTMENTS = ["General", "HR", "Development", "Testing", "Sales & BD", "Operations", "Finance"];

export const getSops = () => axios.get(API, config).then(data);
export const getSop = (uuid) => axios.get(`${API}/${uuid}`, config).then(data);
export const createSop = (payload) => axios.post(API, payload, config).then(data);
export const updateSop = (uuid, payload) => axios.put(`${API}/${uuid}`, payload, config).then(data);
export const deleteSop = (uuid) => axios.delete(`${API}/${uuid}`, config).then(data);

export function getSopError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status;
  const body = error?.response?.data;

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do this.";
  if (Array.isArray(body?.errors) && body.errors.length) return body.errors[0].message;
  return body?.message || fallback;
}
