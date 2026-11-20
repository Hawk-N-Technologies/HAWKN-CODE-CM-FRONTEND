import axios from "axios";

/**
 * Delivery & Handover API.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const API = "/api/deliveries";
const config = { withCredentials: true };

// Admin: all · Tester: their projects · Client: only what Admin approved
export async function getDeliveries() {
  const res = await axios.get(API, config);
  return res.data.data;
}

// Tester: projects they can deliver (+ live link / docs link from Deployment Planning)
export async function getTesterDeliveryProjects() {
  const res = await axios.get(`${API}/tester/projects`, config);
  return res.data.data;
}

export async function submitDelivery(payload) {
  const res = await axios.post(API, payload, config);
  return res.data.data;
}

// Tester: fix a delivery Admin sent back, and resubmit it
export async function resubmitDelivery(uuid, payload) {
  const res = await axios.put(`${API}/${uuid}`, payload, config);
  return res.data.data;
}

export async function approveDelivery(uuid) {
  const res = await axios.patch(`${API}/${uuid}/approve`, {}, config);
  return res.data.data;
}

export async function sendBackDelivery(uuid, note) {
  const res = await axios.patch(`${API}/${uuid}/send-back`, { note }, config);
  return res.data.data;
}

export async function acceptDelivery(uuid) {
  const res = await axios.patch(`${API}/${uuid}/accept`, {}, config);
  return res.data.data;
}

// Client: follow-up → a "Change Request" ticket
export async function requestDeliveryFollowUp(uuid, payload) {
  const res = await axios.post(`${API}/${uuid}/follow-up`, payload, config);
  return res.data.data;
}

// Any axios error → a message a human can read (incl. field errors from Joi)
export function getDeliveryError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do this.";
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors[0].message;
  return data?.message || fallback;
}
