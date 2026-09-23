import { useState } from "react";
import Button from "../../components/common/Button";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

function Flowchart() {
  const [file, setFile] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Flowchart</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Upload and maintain the project's process flowchart.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <FileUpload
          label="Flowchart"
          onFileSelect={setFile}
          helperText={file?.name ?? "Upload the project flowchart."}
        />
        {file && (
          <div className="mt-4 rounded-lg border border-cm-border p-4">
            <p className="text-sm font-medium text-cm-text">{file.name}</p>
            <p className="mt-1 text-xs text-cm-text-muted">
              Selected for upload.
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
          <Button
            disabled={!file}
            onClick={() => showToast.success("Flowchart saved.")}
          >
            Save Flowchart
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Flowchart;
