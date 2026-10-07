import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";

export default function BRDApproval() {
  const [status, setStatus] = useState("Pending Approval");
  const [comment, setComment] = useState("");

  const approve = () => {
    setStatus("Approved");
    showToast.success("BRD approved successfully.");
  };

  const reject = () => {
    setStatus("Changes Requested");
    showToast.success("Changes requested for the BRD.");
  };

  const saveComment = (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    showToast.success("Approval comment saved.");
    setComment("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">BRD Approval</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review and approve the submitted business requirements.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-cm-text-muted">BRD-001</p>
            <h2 className="mt-1 text-lg font-semibold text-cm-text">
              Acme Retail ERP Business Requirements
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Project: Acme Retail ERP · Version: v1.2
            </p>
          </div>

          <Badge
            tone={
              status === "Approved"
                ? "success"
                : status === "Changes Requested"
                  ? "danger"
                  : "warning"
            }
          >
            {status}
          </Badge>
        </div>

        <div className="mt-6 space-y-4 text-sm text-cm-text-muted">
          <p>
            The proposed ERP will cover inventory, customer management, order
            processing, reporting and user access control.
          </p>
          <p>
            The current version includes the agreed project scope, functional
            requirements and initial acceptance criteria.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={reject}>
            Request Changes
          </Button>
          <Button onClick={approve}>Approve BRD</Button>
        </div>
      </section>

      <form
        onSubmit={saveComment}
        className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-cm-text">Approval Comment</h2>

        <div className="mt-4">
          <Textarea
            label="Comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add an approval comment..."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit">Save Comment</Button>
        </div>
      </form>
    </div>
  );
}
