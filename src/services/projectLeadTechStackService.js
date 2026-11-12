import axios from "axios";

const BASE = "/api/project-lead/tech-stack";
const config = { withCredentials: true };

export async function getTechStackProjects() {
  const response = await axios.get(`${BASE}/projects`, config);
  return response.data.data;
}

export async function getProjectTechStack(projectUuid) {
  const response = await axios.get(
    `${BASE}/projects/${projectUuid}`,
    config,
  );

  return response.data.data;
}

export async function saveProjectTechStack(projectUuid, technologyStack) {
  const response = await axios.put(
    `${BASE}/projects/${projectUuid}`,
    { technologyStack },
    config,
  );

  return response.data;
}