import axios from "axios";

const BASE = "/api/developer/testing";
const config = { withCredentials: true };

export async function getMyTestingRecords() {
  const response = await axios.get(BASE, config);
  return response.data.data;
}

export async function saveDeveloperTestingResult(taskUuid, payload) {
  const response = await axios.put(
    `${BASE}/${encodeURIComponent(taskUuid)}`,
    payload,
    config,
  );

  return response.data.data;
}

export function getDeveloperTestingError(error) {
  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to update this task.";
  }

  return (
    error?.response?.data?.message ||
    "Unable to complete the testing request. Please try again."
  );
}