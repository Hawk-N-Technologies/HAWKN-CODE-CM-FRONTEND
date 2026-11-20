import axios from "axios";

/**
 * Testing module API — Build Testing, Phase Testing, client phase approval,
 * Field Training. withCredentials sends the HttpOnly login cookie.
 */
const API = "/api/testing";
const config = { withCredentials: true };
const data = (res) => res.data.data;

export const getTesterProjects = () => axios.get(`${API}/tester/projects`, config).then(data);

// Build Testing
export const getBuilds = () => axios.get(`${API}/builds`, config).then(data);
export const addBuild = (payload) => axios.post(`${API}/builds`, payload, config).then(data);
export const recordBuildResult = (uuid, payload) =>
  axios.patch(`${API}/builds/${uuid}/result`, payload, config).then(data);

// Phase Testing
export const getTestPhases = () => axios.get(`${API}/phases`, config).then(data);
export const signOffPhase = (uuid, payload) =>
  axios.patch(`${API}/phases/${uuid}/sign-off`, payload, config).then(data);

// Client approval
export const getClientPhases = () => axios.get(`${API}/client/phases`, config).then(data);
export const decidePhase = (uuid, payload) =>
  axios.patch(`${API}/client/phases/${uuid}/decision`, payload, config).then(data);

// Field Training
export const getTrainings = () => axios.get(`${API}/trainings`, config).then(data);
export const scheduleTraining = (payload) => axios.post(`${API}/trainings`, payload, config).then(data);
export const updateTraining = (uuid, payload) =>
  axios.put(`${API}/trainings/${uuid}`, payload, config).then(data);

// Any axios error → a message a human can read (incl. field errors from Joi)
export function getTestingError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status;
  const body = error?.response?.data;

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do this.";
  if (Array.isArray(body?.errors) && body.errors.length) return body.errors[0].message;
  return body?.message || fallback;
}
