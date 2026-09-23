import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

const INITIAL = {
  repository: "",
  serverStatus: "Not Configured",
  cicdStatus: "Not Active",
  development: "",
  staging: "",
  live: "",
  credentialsStatus: "Not Added",
};

function DeploymentPlanning() {
  const [form, setForm] = useState(INITIAL);
  const [selectedFile, setSelectedFile] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = (event) => {
    event.preventDefault();
    showToast.success("Deployment planning saved.");
  };

  const statusTone = (value) => {
    if (value === "Connected" || value === "Configured" || value === "Active")
      return "success";
    if (value === "Not Configured" || value === "Not Active") return "warning";
    return "neutral";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Deployment Planning</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track repository, server, CI/CD and environment configuration for each
          project.
        </p>
      </div>

      <form
        onSubmit={save}
        className="flex flex-col gap-6 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <div>
          <h2 className="text-sm font-semibold text-cm-text">
            Deployment Status
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">GitHub</p>
              <Badge tone={form.repository ? "success" : "warning"}>
                {form.repository ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <div className="rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">Server</p>
              <Badge tone={statusTone(form.serverStatus)}>
                {form.serverStatus}
              </Badge>
            </div>
            <div className="rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">CI/CD</p>
              <Badge tone={statusTone(form.cicdStatus)}>
                {form.cicdStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="GitHub Repository"
            placeholder="https://github.com/org/repository"
            value={form.repository}
            onChange={(e) => update("repository", e.target.value)}
          />
          <Select
            label="Server Configuration Status"
            value={form.serverStatus}
            options={["Not Configured", "Configured"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={(e) => update("serverStatus", e.target.value)}
          />
          <Select
            label="CI/CD Status"
            value={form.cicdStatus}
            options={["Not Active", "Active"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={(e) => update("cicdStatus", e.target.value)}
          />
          <Select
            label="Credentials"
            value={form.credentialsStatus}
            options={["Not Added", "Added"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={(e) => update("credentialsStatus", e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-cm-text">
            Environment Domain Mapping
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Development"
              placeholder="dev.example.com"
              value={form.development}
              onChange={(e) => update("development", e.target.value)}
            />
            <Input
              label="Staging"
              placeholder="staging.example.com"
              value={form.staging}
              onChange={(e) => update("staging", e.target.value)}
            />
            <Input
              label="Live / Production"
              placeholder="example.com"
              value={form.live}
              onChange={(e) => update("live", e.target.value)}
            />
          </div>
        </div>

        <FileUpload
          label="CI/CD / Deployment Documentation (optional)"
          onFileSelect={setSelectedFile}
          helperText={
            selectedFile
              ? selectedFile.name
              : "Upload optional deployment documentation."
          }
        />

        <div className="flex justify-end border-t border-cm-border pt-4">
          <Button type="submit">Save Deployment Plan</Button>
        </div>
      </form>
    </div>
  );
}

export default DeploymentPlanning;
