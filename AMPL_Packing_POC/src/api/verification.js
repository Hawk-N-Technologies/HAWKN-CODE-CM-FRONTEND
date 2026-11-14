import { apiRequest } from "./client";

export const lookupBox = (code) => apiRequest(`/boxes/lookup?code=${encodeURIComponent(code)}`);
export const recordVerification = (publicId, { method, result, notes }) =>
  apiRequest(`/boxes/${publicId}/verifications`, { method: "POST", body: { method, result, notes } });
