import { ExternalLink, FileText, MessageSquareWarning, PackageCheck } from "lucide-react";

import Badge from "../common/Badge";

/**
 * What's in a delivery: live link, deliverables, how-to documents, notes and
 * (if any) the client's follow-up ticket. Read-only, shared by every role.
 */
export default function DeliveryDetails({ delivery, showAdminNote = false }) {
  return (
    <div className="space-y-5">
      {showAdminNote && delivery.adminNote && (
        <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
              Sent back by Admin
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-rose-800">
              {delivery.adminNote}
            </p>
          </div>
        </div>
      )}

      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Live link
        </p>
        <a
          href={delivery.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
        >
          {delivery.liveUrl}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      </section>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Deliverables
        </p>
        <ul className="mt-2 space-y-1.5">
          {delivery.deliverables.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
              <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          How-to documents
        </p>
        {delivery.docs.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No documents attached.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {delivery.docs.map((doc, index) => (
              <li key={`${doc.url}-${index}`}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="break-words">{doc.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {delivery.notes && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Notes
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{delivery.notes}</p>
        </section>
      )}

      {delivery.followUp && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
            Follow-up (Change Request)
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-amber-900">{delivery.followUp.title}</p>
            <Badge tone="warning">{delivery.followUp.status}</Badge>
          </div>
        </section>
      )}
    </div>
  );
}
