import axios from "axios";

export async function getHrDashboard() {
  const response = await axios.get("/api/hr/dashboard", {
    withCredentials: true,
  });

  return response.data.data;
}