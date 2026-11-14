import { apiRequest } from "./client";

export const getMySections = () => apiRequest("/my/sections");
export const startBox = (sectionId) => apiRequest(`/sections/${sectionId}/boxes`, { method: "POST" });
export const getBox = (publicId) => apiRequest(`/boxes/${publicId}`);
export const scanIntoBox = (publicId, rawValue, clientScanId) =>
  apiRequest(`/boxes/${publicId}/scans`, {
    method: "POST",
    body: { raw_value: rawValue, client_scan_id: clientScanId },
  });
export const removeFromBox = (publicId, uid, reason) =>
  apiRequest(`/boxes/${publicId}/items/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    body: { reason },
  });
export const completeBox = (publicId) => apiRequest(`/boxes/${publicId}/complete`, { method: "POST" });
export const cancelBox = (publicId, reason) =>
  apiRequest(`/boxes/${publicId}/cancel`, { method: "POST", body: { reason } });
