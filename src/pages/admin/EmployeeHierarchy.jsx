import { useState } from "react";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

function EmployeeHierarchy() {
  const [image, setImage] = useState(null);

  const handleFileSelect = (file) => {
    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast.error("Please upload an image file.");
      return;
    }

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);

    // Remove previous preview URL
    if (image) {
      URL.revokeObjectURL(image);
    }

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
        <div className="flex flex-col gap-5">
          <FileUpload
            label="Employee Hierarchy"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            maxSizeMB={10}
            onFileSelect={handleFileSelect}
            helperText="Upload PNG, JPG, JPEG, or WEBP image up to 10MB."
          />

          {/* Preview */}
          {image && (
            <div className="rounded-cm-md border border-cm-border bg-cm-bg p-4">
              <p className="mb-3 text-sm font-medium text-cm-text">Preview</p>

              <div className="flex justify-center overflow-auto">
                <img
                  src={image}
                  alt="Employee hierarchy"
                  className="max-h-[700px] max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeHierarchy;
