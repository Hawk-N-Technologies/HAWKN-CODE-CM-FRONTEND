// Delivery statuses → Badge tone (Badge has success / warning / danger / info / neutral)
export const DELIVERY_STATUS_TONE = {
  "Pending Admin Approval": "warning",
  "Sent Back": "danger",
  "Sent to Client": "info",
  Accepted: "success",
  "Follow-up Requested": "warning",
};

// Shorter wording for clients (they never see the internal steps)
export const CLIENT_STATUS_LABEL = {
  "Sent to Client": "Waiting for you",
  Accepted: "Accepted",
  "Follow-up Requested": "Follow-up requested",
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

// Search text for a delivery (project, version, status, client)
export const deliverySearchText = (delivery) =>
  [
    delivery.project?.name,
    delivery.versionLabel,
    delivery.status,
    delivery.clientName,
    delivery.submittedBy,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
