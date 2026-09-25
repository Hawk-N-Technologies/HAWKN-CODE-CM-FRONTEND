import { useState } from "react";
import { showToast } from "../../components/common/Toast";

function EmployeeHierarchy() {
  const [image, setImage] = useState(null);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Please upload an image file.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);

    showToast.success("Employee hierarchy uploaded.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">Employee Hierarchy</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Upload the company employee hierarchy.
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-cm-lg border border-cm-border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          {/* Hidden file input */}
          <input
            id="hierarchy-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleUpload}
            className="hidden"
          />

          {/* Upload button */}
          <label
            htmlFor="hierarchy-upload"
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-cm-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Upload Hierarchy
          </label>

          {/* Image preview */}
          {image && (
            <div className="w-full">
              <img
                src={image}
                alt="Employee hierarchy"
                className="mx-auto max-h-[700px] max-w-full rounded-lg border border-cm-border object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeHierarchy;
