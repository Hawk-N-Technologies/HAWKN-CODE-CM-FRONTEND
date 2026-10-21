import axios from "axios";

const API = "/api/notifications";

export async function fetchNotifications({ limit = 50, offset = 0 } = {}) {
  const response = await axios.get(API, {
    params: { limit, offset },
    withCredentials: true,
  });

  return response.data.data;
}

export async function markNotificationRead(id) {
  const response = await axios.patch(
    `${API}/${id}/read`,
    {},
    { withCredentials: true },
  );

  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await axios.patch(
    `${API}/read-all`,
    {},
    { withCredentials: true },
  );

  return response.data.data;
}

export async function createTestNotification() {
  const response = await axios.post(
    `${API}/test`,
    {},
    { withCredentials: true },
  );

  return response.data;
}