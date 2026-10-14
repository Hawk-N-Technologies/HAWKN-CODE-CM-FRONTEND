import axios from "axios";

const BASE = "/api/tester";
const config = { withCredentials: true };

export async function getTesterAssignedProjects() {
  const response = await axios.get(`${BASE}/projects`, config);
  return response.data.data;
}

export async function getTesterOverview() {
  const response = await axios.get(`${BASE}/overview`, config);
  return response.data.data;
}