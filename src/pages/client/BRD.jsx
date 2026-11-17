import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { showToast } from "../../components/common/Toast";
import { getErrorMessage } from "../../services/developerProjectService";

/**
 * Client → Business Requirements (read-only overview).
 * Lists the client's own BRDs. Approving / requesting changes happens on
 * the BRD Approval page.
 */

const BRD_API = "/api/brds";
const axiosConfig = { withCredentials: true };

// Same labels as the BRD Approval page
const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING_ADMIN_APPROVAL: "Pending admin review",
  ADMIN_REJECTED: "Admin rejected",
  PENDING_CLIENT_APPROVAL: "Awaiting your approval",
  CLIENT_REJECTED: "Changes requested",
  APPROVED: "Approved",
};

const STATUS_TONE = {
  PENDING_CLIENT_APPROVAL: "warning",
  APPROVED: "success",
  CLIENT_REJECTED: "danger",
  ADMIN_REJECTED: "danger",
};

const personName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "—";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function BRD() {
  const navigate = useNavigate();
  const [brds, setBrds] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let ignore = false;

    axios
      .get(`${BRD_API}/client`, axiosConfig)
      .then((response) => {
        if (ignore) return;
        const list = response.data.data || [];
        setBrds(list);
        if (list.length) setSelectedUuid(list[0].uuid);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load your BRDs."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const brd = useMemo(
    () => brds.find((item) => item.uuid === selectedUuid) || null,
    [brds, selectedUuid],
  );

  // Versions arrive newest first
  const latest = brd?.versions?.[0] || null;
  const reviews = latest?.reviews || [];

  const downloadLatest = async () => {
    if (!latest) return;
    setDownloading(true);

    try {
      const response = await axios.get(`${BRD_API}/versions/${latest.uuid}/file`, {
        ...axiosConfig,
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = latest.fileName || "brd";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast.error("Couldn't download the document.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Business Requirements
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Review the business requirements document for your project.
          </p>
        </div>

        {brds.length > 1 && (
          <select
            aria-label="Select BRD"
            value={selectedUuid}
            onChange={(event) => setSelectedUuid(event.target.value)}
            className="h-10 min-w-[16rem] rounded-lg border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {brds.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.project?.name ? `${item.project.name} — ` : ""}
                {item.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && <p className="text-sm text-cm-text-muted">Loading…</p>}

      {!isLoading && loadError && (
        <p className="rounded-cm-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && !brd && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-cm-text">No BRD yet</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            Your business requirements document will appear here once it is
            shared with you.
          </p>
        </section>
      )}

      {brd && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">
                BRD-{String(brd.uuid).slice(0, 6).toUpperCase()}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {brd.title}
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {brd.project?.name || "—"} · {latest ? `v${latest.version}` : "No file yet"}
              </p>
            </div>
            <Badge tone={STATUS_TONE[brd.status] || "neutral"}>
              {STATUS_LABEL[brd.status] || brd.status}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-cm-text-muted">Uploaded By</p>
              <p className="mt-1 text-sm font-medium text-cm-text">
                {personName(latest?.uploader || brd.creator)}
              </p>
            </div>
            <div>
              <p className="text-xs text-cm-text-muted">Uploaded Date</p>
              <p className="mt-1 text-sm font-medium text-cm-text">
                {formatDate(latest?.createdAt || brd.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-cm-text-muted">Version</p>
              <p className="mt-1 text-sm font-medium text-cm-text">
                {latest ? `v${latest.version}` : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-cm-border bg-gray-50 p-5">
            <h3 className="text-sm font-semibold text-cm-text">
              Requirements Summary
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-cm-text-muted">
              {brd.description || "No summary was added for this BRD."}
            </p>
          </div>

          {reviews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-cm-text">Review history</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {reviews.map((review) => (
                  <li
                    key={review.uuid}
                    className="rounded-lg border border-cm-border p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-cm-text">
                        {personName(review.reviewer)} ({review.reviewerRole})
                      </span>
                      <Badge tone={review.action === "APPROVED" ? "success" : "danger"}>
                        {review.action === "APPROVED" ? "Approved" : "Changes requested"}
                      </Badge>
                    </div>
                    {review.message && (
                      <p className="mt-2 text-cm-text-muted">{review.message}</p>
                    )}
                    <p className="mt-2 text-xs text-cm-text-muted">
                      {formatDate(review.reviewedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!latest || downloading}
              onClick={downloadLatest}
            >
              {downloading ? "Downloading…" : "Download document"}
            </Button>

            {brd.status === "PENDING_CLIENT_APPROVAL" && (
              <Button type="button" onClick={() => navigate("/client/brd-approval")}>
                Review &amp; decide
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
