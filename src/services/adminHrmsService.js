import axios from "axios";

/**
 * Admin HRMS — read-only API calls (GET only).
 * withCredentials sends the HttpOnly login cookie with every request.
 */
const BASE = "/api/admin/hrms";
const config = { withCredentials: true };

const get = async (path, params) => {
  const res = await axios.get(`${BASE}${path}`, { ...config, params });
  return res.data.data;
};

export const getHrmsSummary = () => get("/summary");
export const getHrmsEmployees = () => get("/employees");
export const getHrmsAttendance = (date) => get("/attendance", date ? { date } : {});
export const getHrmsLeaves = (status) => get("/leaves", status ? { status } : {});
export const getHrmsPayroll = (month) => get("/payroll", month ? { month } : {});
export const getHrmsInternshipProbation = () => get("/internship-probation");

// Existing admin endpoint (Company → Employee Hierarchy) — read only here
export async function getHierarchyImages() {
  const res = await axios.get("/api/company/hierarchy", config);
  return res.data.data;
}