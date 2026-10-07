import { useState } from "react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";

const INITIAL_BRD = {
  id: "BRD-001",
  title: "Acme Retail ERP Business Requirements",
  project: "Acme Retail ERP",
  version: "v1.2",
  status: "Pending Approval",
  uploadedBy: "Rohan Mehta",
  uploadedDate: "2026-10-03",
  content:
    "The system will provide inventory management, customer management, order processing, reporting and role-based access.",
};

export default function BRD() {
  const [brd, setBrd] = useState(INITIAL_BRD);
  const [comment, setComment] = useState("");

  const submitComment = (event) => {
    event.preventDefault();

    if (!comment.trim()) return;

    showToast.success("Comment added.");
    setComment("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Business Requirements
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review the business requirements document for your project.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-cm-text-muted">{brd.id}</p>
            <h2 className="mt-1 text-lg font-semibold text-cm-text">
              {brd.title}
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {brd.project} · {brd.version}
            </p>
          </div>

          <Badge tone="warning">{brd.status}</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-cm-text-muted">Uploaded By</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {brd.uploadedBy}
            </p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Uploaded Date</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {brd.uploadedDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Version</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {brd.version}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-cm-border bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-cm-text">
            Requirements Summary
          </h3>
          <p className="mt-2 text-sm leading-6 text-cm-text-muted">
            {brd.content}
          </p>
        </div>
      </section>

      <form
        onSubmit={submitComment}
        className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-cm-text">Client Comments</h2>
        <div className="mt-4">
          <Textarea
            label="Comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add your comments about the BRD..."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit">Add Comment</Button>
        </div>
      </form>
    </div>
  );
}
