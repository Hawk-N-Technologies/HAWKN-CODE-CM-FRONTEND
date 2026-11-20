// Badge tones (Badge: success / warning / danger / info / neutral)
export const RESULT_TONE = { Pending: "warning", Passed: "success", Failed: "danger" };

export const CLIENT_APPROVAL_TONE = {
  Pending: "info",
  Approved: "success",
  Rejected: "danger",
  "Changes Requested": "warning",
};

export const TRAINING_TONE = {
  Scheduled: "info",
  Rescheduled: "warning",
  Completed: "success",
  Cancelled: "neutral",
};

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// <input type="datetime-local"> value in the viewer's local time
export const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const matches = (query, ...values) =>
  !query || values.filter(Boolean).join(" ").toLowerCase().includes(query);
