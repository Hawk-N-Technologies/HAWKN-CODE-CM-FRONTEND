import RoleNotificationsPage from "../../components/notifications/RoleNotificationsPage";

export default function Notifications() {
  return (
    <RoleNotificationsPage
      eyebrow="Testing"
      description="Bugs ready for retest, team changes and testing updates."
      linkPrefixes={["/tester/"]}
    />
  );
}
