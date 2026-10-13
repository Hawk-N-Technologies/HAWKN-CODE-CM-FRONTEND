import axios from "axios";

const BASE = "/api/project-lead/team";
const config = { withCredentials: true };

export async function getTeamProjects() {
  const response = await axios.get(`${BASE}/projects`, config);
  return response.data.data;
}

export async function getProjectTeam(projectUuid) {
  const response = await axios.get(
    `${BASE}/projects/${projectUuid}`,
    config,
  );

  return response.data.data;
}

export async function saveProjectTeam(projectUuid, payload) {
  const response = await axios.put(
    `${BASE}/projects/${projectUuid}`,
    payload,
    config,
  );

  return response.data;
}