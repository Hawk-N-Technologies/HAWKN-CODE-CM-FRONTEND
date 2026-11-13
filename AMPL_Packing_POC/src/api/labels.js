import { apiRequest } from "./client";

export const getBatchLabels = (batchId, page = 1) =>
  apiRequest(`/uid-batches/${batchId}/labels?page=${page}`);
export const getBoxLabel = (publicId) => apiRequest(`/boxes/${publicId}/label`);
