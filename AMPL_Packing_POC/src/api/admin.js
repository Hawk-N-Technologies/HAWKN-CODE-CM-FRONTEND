import { apiRequest } from "./client";

const post = (path, body) => apiRequest(path, { method: "POST", body, full: true });
const patch = (path, body) => apiRequest(path, { method: "PATCH", body, full: true });
const del = (path) => apiRequest(path, { method: "DELETE", full: true });

// SKUs and UIDs
export const listSkus = () => apiRequest("/skus?page_size=100");
export const createSku = (body) => post("/skus", body);
export const updateSku = (id, body) => patch(`/skus/${id}`, body);
export const generateUids = (skuId, quantity) => post(`/skus/${skuId}/uid-batches`, { quantity });
export const listBatches = ({ page = 1, sku = "" } = {}) =>
  apiRequest(`/uid-batches?page=${page}&page_size=25${sku ? `&sku=${sku}` : ""}`, { full: true });

// Box configurations
export const listConfigurations = () => apiRequest("/box-configurations");
export const createConfiguration = (body) => post("/box-configurations", body);
export const updateConfiguration = (id, body) => patch(`/box-configurations/${id}`, body);
export const createConfigurationVersion = (id, body) => post(`/box-configurations/${id}/versions`, body);

// Packing sections
export const listSections = () => apiRequest("/sections");
export const createSection = (body) => post("/sections", body);
export const updateSection = (id, body) => patch(`/sections/${id}`, body);
export const addSectionOperator = (id, userId) => post(`/sections/${id}/operators`, { user_id: userId });
export const removeSectionOperator = (id, userId) => del(`/sections/${id}/operators/${userId}`);

// Users
export const listUsers = (role = "") => apiRequest(`/users${role ? `?role=${role}` : ""}`);
export const createUser = (body) => post("/users", body);
export const updateUser = (id, body) => patch(`/users/${id}`, body);
