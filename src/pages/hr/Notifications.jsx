import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";

const INITIAL = [
  {
    id: 1,
    title: "New onboarding pending",
    message: "A new employee onboarding record needs HR action.",
    type: "Onboarding",
    read: false,
    time: "10 min ago",
  },
  {
    id: 2,
    title: "Leave request",
    message: "A leave request is waiting for approval.",
    type: "Leave",
    read: false,
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "SOP updated",
    message: "An HR SOP has a new effective date.",
    type: "SOP",
    read: true,
    time: "Yesterday",
  },
  {
    id: 4,
    title: "Payroll reminder",
    message: "Monthly payroll processing is due.",
    type: "Payroll",
    read: true,
    time: "Yesterday",
  },
];

function Notifications() {
  const [items, setItems] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" ? !item.read : item.type === filter);
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [items, search, filter]);

  const markRead = (id) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  const markAllRead = () =>
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Notifications</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            HR notifications for onboarding, attendance, leave, payroll and SOP
            changes.
          </p>
        </div>
        <Button variant="outline" onClick={markAllRead}>
          Mark All Read
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "Unread", "Onboarding", "Leave", "SOP", "Payroll"].map(
          (value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "primary" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value}
            </Button>
          ),
        )}
      </div>

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search notifications…"
      />

      <div className="flex flex-col gap-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className={`rounded-cm-lg border bg-cm-card p-5 shadow-sm ${item.read ? "border-cm-border" : "border-blue-200"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-cm-text">{item.title}</h2>
                  <Badge tone={item.read ? "neutral" : "info"}>
                    {item.read ? "Read" : "Unread"}
                  </Badge>
                  <Badge tone="neutral">{item.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-cm-text-muted">
                  {item.message}
                </p>
                <p className="mt-2 text-xs text-cm-text-muted">{item.time}</p>
              </div>
              {!item.read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markRead(item.id)}
                >
                  Mark Read
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
