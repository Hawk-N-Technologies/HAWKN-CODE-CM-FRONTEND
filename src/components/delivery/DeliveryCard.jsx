import { CalendarClock, FolderKanban } from "lucide-react";

import Badge from "../common/Badge";
import { DELIVERY_STATUS_TONE, formatDateTime } from "./deliveryUtils";

/**
 * One delivery in a list: project, version, status, when + who.
 * `statusLabel` lets the client page show friendlier wording.
 * `children` = the role's action buttons.
 */
export default function DeliveryCard({ delivery, statusLabel, meta, children }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <FolderKanban className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-bold text-[#101a3a]">
              {delivery.project.name}
            </h3>
            {delivery.versionLabel && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {delivery.versionLabel}
              </span>
            )}
            <Badge tone={DELIVERY_STATUS_TONE[delivery.status] ?? "neutral"}>
              {statusLabel ?? delivery.status}
            </Badge>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {meta ?? formatDateTime(delivery.submittedAt ?? delivery.sentToClientAt)}
          </p>
        </div>
      </div>

      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      )}
    </article>
  );
}
