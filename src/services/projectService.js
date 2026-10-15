import axios from "axios";

/**
 * Admin → Project Management API calls.
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/admin/projects";
const config = { withCredentials: true };

// Dropdown data for the form: { clients: [...], projectLeads: [...] }
export async function getProjectOptions() {
  const res = await axios.get(`${BASE}/options`, config);
  return res.data.data;
}

export async function getProjects() {
  const res = await axios.get(BASE, config);
  return res.data.data;
}

export async function createProject(payload) {
  const res = await axios.post(BASE, payload, config);
  return res.data;
}

// Edit sends every field again (same shape as create)
export async function updateProject(uuid, payload) {
  const res = await axios.put(`${BASE}/${uuid}`, payload, config);
  return res.data;
}

// Only Planning / Cancelled projects can be deleted
export async function deleteProject(uuid) {
  await axios.delete(`${BASE}/${uuid}`, config);
}