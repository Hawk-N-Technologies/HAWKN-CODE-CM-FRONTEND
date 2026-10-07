import Badge from "../../components/common/Badge";

const deliveries = [
  {
    id: "DEL-001",
    project: "Acme Retail ERP",
    build: "Build 1.8.0",
    deliveryDate: "2026-10-12",
    environment: "Production",
    status: "Scheduled",
  },
  {
    id: "DEL-002",
    project: "Internal HRMS",
    build: "Build 2.1.0",
    deliveryDate: "2026-10-20",
    environment: "Staging",
    status: "In Progress",
  },
  {
    id: "DEL-003",
    project: "Legacy CRM",
    build: "Build 4.5.2",
    deliveryDate: "2026-09-25",
    environment: "Production",
    status: "Delivered",
  },
];

export default function Delivery() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Delivery</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track project builds, environments and delivery milestones.
        </p>
      </div>

      <div className="overflow-x-auto rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-cm-border bg-gray-50">
            <tr>
              <th className="px-5 py-3 font-semibold text-cm-text">
                Delivery ID
              </th>
              <th className="px-5 py-3 font-semibold text-cm-text">Project</th>
              <th className="px-5 py-3 font-semibold text-cm-text">Build</th>
              <th className="px-5 py-3 font-semibold text-cm-text">
                Environment
              </th>
              <th className="px-5 py-3 font-semibold text-cm-text">Date</th>
              <th className="px-5 py-3 font-semibold text-cm-text">Status</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className="border-b border-cm-border last:border-0"
              >
                <td className="px-5 py-4 text-cm-text-muted">{delivery.id}</td>
                <td className="px-5 py-4 font-medium text-cm-text">
                  {delivery.project}
                </td>
                <td className="px-5 py-4 text-cm-text-muted">
                  {delivery.build}
                </td>
                <td className="px-5 py-4 text-cm-text-muted">
                  {delivery.environment}
                </td>
                <td className="px-5 py-4 text-cm-text-muted">
                  {delivery.deliveryDate}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    tone={delivery.status === "Delivered" ? "success" : "info"}
                  >
                    {delivery.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
