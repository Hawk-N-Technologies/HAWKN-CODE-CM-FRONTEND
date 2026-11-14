import { apiRequest } from "./client";

export const fetchCsrf = () => apiRequest("/auth/csrf");
export const fetchMe = () => apiRequest("/auth/me");
export const postLogin = (username, password) =>
  apiRequest("/auth/login", { method: "POST", body: { username, password } });
export const postLogout = () => apiRequest("/auth/logout", { method: "POST" });
