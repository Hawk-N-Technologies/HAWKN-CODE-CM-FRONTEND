import axios from "axios";

const BASE = "/api/project-lead/planning";
const config = { withCredentials: true };

export async function getPlanningProjects() {
  const response = await axios.get(`${BASE}/projects`, config);
  return response.data.data;
}

export async function getProjectPlanning(projectUuid) {
  const response = await axios.get(
    `${BASE}/projects/${projectUuid}`,
    config,
  );

  return response.data.data;
}

export async function saveProjectPlanning(projectUuid, payload) {
  const response = await axios.put(
    `${BASE}/projects/${projectUuid}`,
    payload,
    {
      ...config,
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
}

export function getPlanningFileUrl(projectUuid, kind) {
  return `${BASE}/projects/${projectUuid}/files/${kind}`;
}