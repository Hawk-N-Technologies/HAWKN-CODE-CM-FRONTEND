import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ExternalLink, GraduationCap, RefreshCw, Video } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/layout/PageHeader";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import { TRAINING_TONE, formatDateTime, matches } from "../../components/testing/testingUtils";
import usePagination from "../../hooks/usePagination";
import { getTestingError, getTrainings } from "../../services/testingService";

/**
 * Client → Training (read-only).
 * Training sessions our team scheduled for you: when, how to join, notes.
 * Upcoming sessions first, then past ones.
 */

const isUpcoming = (training) =>
  ["Scheduled", "Rescheduled"].includes(training.status) && new Date(training.scheduledAt) >= new Date(Date.now() - 3600000);

export default function Training() {
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    getTrainings()
      .then((list) => {
        if (ignore) return;
        setTrainings(list);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load your training sessions."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = trainings.filter((item) => matches(query, item.title, item.project.name, item.status));
    const upcoming = list.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const past = list.filter((item) => !isUpcoming(item));
    return [...upcoming, ...past];
  }, [trainings, search]);

  // 10 per page
  const pager = usePagination(visible);
  const next = trainings.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title="Training"
        description="Training sessions our team has scheduled for you — when they are and how to join."
        icon={GraduationCap}
      />

      {next && (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Next session</p>
            <p className="mt-1 text-base font-bold text-blue-950">{next.title}</p>
            <p className="text-sm text-blue-900">
              {formatDateTime(next.scheduledAt)}
              {next.durationMinutes ? ` · ${next.durationMinutes} min` : ""} · {next.project.name}
            </p>
          </div>
          {next.meetingLink && (
            <a
              href={next.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0b1932] px-4 text-sm font-semibold text-white hover:bg-[#13254a]"
            >
              <Video className="h-4 w-4" /> Join session
            </a>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">All sessions</h2>
            <p className="text-sm text-slate-500">Upcoming first.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        {trainings.length > 0 && (
          <div className="mb-4">
            <TableSearch value={search} onChange={setSearch} placeholder="Search session or project…" />
          </div>
        )}

        {isLoading ? (
          <Loader label="Loading your training sessions…" />
        ) : loadError ? (
          <ErrorState title="Couldn't load your training sessions" description={loadError} onRetry={reload} />
        ) : trainings.length === 0 ? (
          <EmptyState title="No training sessions yet" description="When our team schedules one, it will appear here." />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No sessions match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pager.pageItems.map((training) => (
              <article
                key={training.uuid}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-bold text-[#101a3a]">{training.title}</h3>
                    <Badge tone={TRAINING_TONE[training.status]}>{training.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {training.project.name}
                    {training.trainer ? ` · with ${training.trainer}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDateTime(training.scheduledAt)}
                    {training.durationMinutes ? ` · ${training.durationMinutes} min` : ""}
                  </p>
                  {training.notes && (
                    <p className="mt-1 max-w-xl whitespace-pre-line text-xs text-slate-500">{training.notes}</p>
                  )}
                </div>
                {training.meetingLink && isUpcoming(training) && (
                  <a
                    href={training.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    <Video className="h-4 w-4" /> Join <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            ))}
            {pager.hasPages && (
              <TablePagination
                page={pager.page}
                pageSize={pager.pageSize}
                total={pager.total}
                onPageChange={pager.setPage}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
