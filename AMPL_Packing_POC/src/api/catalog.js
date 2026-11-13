import { apiRequest } from "./client";

export const getUidCapacity = ({ signal } = {}) => apiRequest("/uid-capacity", { signal });
