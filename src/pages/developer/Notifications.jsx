import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
const INITIAL = [
  {
    id: 1,
    title: "Task assigned",
    message: "A new task was assigned to you.",
    type: "Task",
    read: false,
    time: "10 min ago",
  },
  {
    id: 2,
    title: "Testing required",
    message: "Dashboard UI is ready for developer testing.",
    type: "Testing",
    read: false,
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Bug returned for retest",
    message: "CSV export bug is ready for retesting.",
    type: "Bug",
    read: true,
    time: "Yesterday",
  },
];
export default function Notifications() {
  const [items, setItems] = useState(INITIAL);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Notifications</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Task, testing, bug and project notifications.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setItems((p) => p.map((x) => ({ ...x, read: true })))}
        >
          Mark All Read
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((i) => (
          <article
            key={i.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <div className="flex gap-2">
                  <h2 className="font-semibold text-cm-text">{i.title}</h2>
                  <Badge tone={i.read ? "neutral" : "info"}>
                    {i.read ? "Read" : "Unread"}
                  </Badge>
                  <Badge tone="neutral">{i.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-cm-text-muted">{i.message}</p>
                <p className="mt-2 text-xs text-cm-text-muted">{i.time}</p>
              </div>
              {!i.read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems((p) =>
                      p.map((x) => (x.id === i.id ? { ...x, read: true } : x)),
                    )
                  }
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
