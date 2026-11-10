import { useState } from "react";
import {
  CheckCircle2,
  FileImage,
  FileText,
  FolderKanban,
  GitBranch,
  Save,
  Upload,
} from "lucide-react";

import Button from "../../components/common/Button";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Flowchart() {
  const [file, setFile] = useState(null);

  const handleSave = () => {
    if (!file) return;

    showToast.success("Flowchart saved.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch size={16} className="text-blue-200" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                Project Management Workspace
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Flowchart
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Upload and maintain the project's process flowchart and
              workflow documentation.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm sm:self-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
              <FolderKanban size={20} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200">
                Documentation
              </p>

              <p className="mt-0.5 text-sm font-bold leading-7 text-white">
                Flowchart
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flowchart Upload */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <SectionHeading
            icon={Upload}
            title="Flowchart Upload"
            description="Select the process flowchart file you want to maintain for this project."
          />
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch size={16} className="text-blue-600" />

              <p className="text-sm font-semibold text-slate-700">
                Upload Project Flowchart
              </p>
            </div>

            <FileUpload
              label="Flowchart"
              onFileSelect={setFile}
              helperText={file?.name ?? "Upload the project flowchart."}
            />
          </div>

          {/* Selected File Preview */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileImage size={16} className="text-blue-600" />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Selected File
                </h3>
              </div>

              {file && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 size={12} />
                  Ready
                </span>
              )}
            </div>

            <div className="p-4">
              {file ? (
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-slate-800">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Selected for upload.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <FileImage size={21} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No File Selected
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Your selected flowchart will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Save Flowchart */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              Ready to Save Flowchart?
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {file
                ? "Your selected flowchart is ready."
                : "Select a flowchart before proceeding."}
            </p>
          </div>
        </div>

        <div className="flex w-full justify-end sm:w-auto">
          <Button
            type="button"
            disabled={!file}
            onClick={handleSave}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Save size={16} />
              Save Flowchart
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Flowchart;