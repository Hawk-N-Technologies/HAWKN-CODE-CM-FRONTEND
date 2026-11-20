import { useState } from "react";
import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";

import Button from "../common/Button";
import TextArea from "../common/TextArea";
import Modal from "../common/Modal";

/**
 * Passed / Failed + notes. A note is required when it failed.
 * Used for Build Testing results and Phase Testing sign-off.
 */
export default function ResultModal({ title, description, eyebrow, initialNotes = "", onClose, onSave }) {
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!result) {
      setError("Pick Passed or Failed.");
      return;
    }
    if (result === "Failed" && notes.trim().length < 3) {
      setError("Say what failed.");
      return;
    }

    setSaving(true);
    const ok = await onSave(result, notes.trim());
    if (!ok) setSaving(false);
  };

  const choice = (value, Icon, activeClass) => (
    <button
      type="button"
      aria-pressed={result === value}
      onClick={() => {
        setResult(value);
        setError("");
      }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        result === value ? activeClass : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {value}
    </button>
  );

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={ClipboardCheck}
      size="sm"
    >
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div className="flex gap-3">
          {choice("Passed", CheckCircle2, "border-emerald-300 bg-emerald-50 text-emerald-800")}
          {choice("Failed", XCircle, "border-rose-300 bg-rose-50 text-rose-800")}
        </div>

        <TextArea
          label={result === "Failed" ? "What failed?" : "Notes (optional)"}
          required={result === "Failed"}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setError("");
          }}
          placeholder={result === "Failed" ? "e.g. Login crashes on Safari" : "Anything worth noting"}
        />

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" loading={saving} onClick={save}>
            Save result
          </Button>
        </div>
      </div>
    </Modal>
  );
}
