import { apiRequest } from "./client";

export const getUidBatches = ({ signal } = {}) => apiRequest("/uid-batches?page_size=10", { signal });
export const batchCsvUrl = (batchId) => `/api/v1/uid-batches/${batchId}/export.csv`;
