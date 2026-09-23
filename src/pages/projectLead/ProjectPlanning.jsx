import { useState } from "react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

function ProjectPlanning() {
  const [form, setForm] = useState({
    project: "Acme Retail ERP",
    description: "",
    deadline: "2026-10-15",
    technology: "MERN",
    erStatus: "Not Uploaded",
    flowStatus: "Not Uploaded",
  });
  const [erFile, setErFile] = useState(null);
  const [flowFile, setFlowFile] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = (e) => {
    e.preventDefault();
    showToast.success("Project planning updated.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Planning</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Maintain project information, deadlines, technology and planning
          documents.
        </p>
      </div>

      <form
        onSubmit={save}
        className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Project"
            value={form.project}
            onChange={(e) => update("project", e.target.value)}
          />
          <Input
            label="Project Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
          />
          <Input
            label="Project Information"
            multiline
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
          <Select
            label="Technology Stack"
            value={form.technology}
            options={["MERN", ".NET + React", "Java + React", "Other"].map(
              (v) => ({ value: v, label: v }),
            )}
            onChange={(e) => update("technology", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FileUpload
            label="ERP / ER Diagram"
            onFileSelect={(file) => {
              setErFile(file);
              update("erStatus", file ? "Uploaded" : "Not Uploaded");
            }}
            helperText={erFile?.name ?? "Optional planning document."}
          />
          <FileUpload
            label="Flowchart"
            onFileSelect={(file) => {
              setFlowFile(file);
              update("flowStatus", file ? "Uploaded" : "Not Uploaded");
            }}
            helperText={flowFile?.name ?? "Optional planning document."}
          />
        </div>

        <div className="flex justify-end border-t border-cm-border pt-4">
          <Button type="submit">Save Planning</Button>
        </div>
      </form>
    </div>
  );
}

export default ProjectPlanning;
