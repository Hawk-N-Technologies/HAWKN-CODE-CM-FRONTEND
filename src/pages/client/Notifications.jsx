import RoleNotificationsPage from "../../components/notifications/RoleNotificationsPage";

export default function Notifications() {
  return (
    <RoleNotificationsPage
      eyebrow="Client Portal"
      description="BRDs waiting for your approval and project updates."
      linkPrefixes={["/client/"]}
    />
  );
}
