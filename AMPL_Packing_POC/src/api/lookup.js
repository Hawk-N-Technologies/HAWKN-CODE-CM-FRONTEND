import { apiRequest } from "./client";

/** Details of a scanned product UID or box ID (read-only). */
export const lookupCode = (code) => apiRequest(`/lookup?code=${encodeURIComponent(code)}`);
