import { apiRequest } from "./client";

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, value);
  });
  return search.toString();
};

export const getDashboard = ({ signal } = {}) => apiRequest("/dashboard/summary", { signal });
export const getPackingHistory = (params) => apiRequest(`/boxes?${query({ page_size: 25, ...params })}`, { full: true });
export const getScanLogs = (params) => apiRequest(`/scan-logs?${query({ page_size: 50, ...params })}`, { full: true });
