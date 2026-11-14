import { apiRequest, API_BASE } from "./client";

export const getUidCapacity = ({ signal } = {}) => apiRequest("/uid-capacity", { signal });
export const getUidBatches = ({ signal } = {}) => apiRequest("/uid-batches?page_size=10", { signal });
export const batchCsvUrl = (batchId) => `${API_BASE}/uid-batches/${batchId}/export.csv`;
