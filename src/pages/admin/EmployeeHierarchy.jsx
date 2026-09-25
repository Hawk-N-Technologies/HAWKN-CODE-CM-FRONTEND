import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

function EmployeeHierarchy() {
  const fileInputRef = useRef(null);

  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Open file picker
  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  // Select multiple images
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast.error(`${file.name} is not an image.`);
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast.error(`${file.name} is larger than 10MB.`);
        return false;
      }

      return true;
    });

    const newImages = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);

    // Allow selecting the same file again
    event.target.value = "";
  };

  // Remove selected image
  const removeImage = (id) => {
    setSelectedImages((prev) => {
      const image = prev.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  // Upload selected images
  const handleUpload = async () => {
    if (!selectedImages.length) {
      showToast.error("Please select at least one image.");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Replace this with your actual API/FormData upload.
      const formData = new FormData();

      selectedImages.forEach((item) => {
        formData.append("hierarchyImages", item.file);
      });

      console.log("Images ready for upload:", selectedImages);

      await new Promise((resolve) => setTimeout(resolve, 800));

      showToast.success(
        `${selectedImages.length} image(s) uploaded successfully.`,
      );

      // Keep images visible after upload.
      // If you want to clear them after successful upload:
      // setSelectedImages([]);
    } catch {
      showToast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">Employee Hierarchy</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Select and upload employee hierarchy images.
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-cm-lg border border-cm-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Button 1: Select */}
            <Button
              type="button"
              variant="outline"
              leftIcon={<ImagePlus size={17} />}
              onClick={handleSelectClick}
            >
              Select Images
            </Button>

            {/* Button 2: Upload */}
            <Button
              type="button"
              leftIcon={<Upload size={17} />}
              onClick={handleUpload}
              loading={isUploading}
              disabled={!selectedImages.length}
            >
              Upload Images
            </Button>
          </div>

          <p className="text-xs text-cm-text-muted">
            Select multiple PNG, JPG, JPEG, or WEBP images. Maximum 10MB per
            image.
          </p>

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-cm-text">
                Selected Images ({selectedImages.length})
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {selectedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-cm-md border border-cm-border bg-gray-50"
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="h-28 w-full object-cover"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                      aria-label={`Remove ${image.file.name}`}
                    >
                      <X size={14} />
                    </button>

                    {/* File name */}
                    <div className="truncate px-2 py-1.5 text-xs text-cm-text-muted">
                      {image.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeHierarchy;
