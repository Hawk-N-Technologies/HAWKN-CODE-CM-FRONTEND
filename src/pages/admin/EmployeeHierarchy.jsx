
import { useRef, useState } from "react";
import {
  ImagePlus,
  Upload,
  X,
  Images,
  ShieldCheck,
  FileImage,
  CheckCircle2,
  CloudUpload,
} from "lucide-react";

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
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6 pb-8">
      {/* Administration Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100 shadow-sm">
              <UsersIcon />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Employee Hierarchy
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage and upload visual representations of your organization's
                employee hierarchy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 backdrop-blur-sm">
            <ShieldCheck size={16} className="text-blue-200" />
            <span className="text-xs font-medium text-slate-100">
              Organization
            </span>
          </div>
        </div>
      </header>

      {/* Upload Overview */}
      <section className="relative overflow-hidden rounded-2xl border border-[#d8e2ef] bg-[#f8faff] shadow-[0_3px_14px_rgba(20,40,75,0.035)]">
        <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-[#172b52]">
              <Images size={21} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
                Hierarchy management
              </p>

              <h2 className="mt-1 text-base font-bold text-[#172b52] sm:text-lg">
                Employee hierarchy images
              </h2>

              <p className="mt-1 max-w-xl text-xs leading-5 text-[#71819b] sm:text-[13px]">
                Select multiple images to prepare your employee hierarchy
                documentation.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-[#d8e2ef] bg-[#eef3fa] px-3 py-2.5">
            <FileImage size={16} className="text-[#172b52]" />
            <span className="text-xs font-semibold text-[#172b52]">
              {selectedImages.length} selected
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full border border-[#d8e2ef]"
        />
      </section>

      {/* Main Upload Panel */}
      <section className="overflow-hidden rounded-2xl border border-[#d8e2ef] bg-white shadow-[0_3px_14px_rgba(20,40,75,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[#e3eaf3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-[#172b52] sm:text-base">
              Upload hierarchy images
            </h2>

            <p className="mt-1 text-xs text-[#71819b]">
              Add and manage the images displayed in this section.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} />
            Multiple files supported
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Area */}
          <div className="rounded-2xl border-2 border-dashed border-[#cbd8e9] bg-[#f6f9fe] px-5 py-9 text-center sm:px-8 sm:py-11">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-white text-[#1b3768] shadow-sm">
              <CloudUpload size={30} strokeWidth={1.6} />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#172b52]">
              Select hierarchy images
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#71819b] sm:text-sm">
              Choose one or multiple image files from your device. Your
              selected images will appear below for review.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                leftIcon={<ImagePlus size={17} />}
                onClick={handleSelectClick}
              >
                Select Images
              </Button>

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

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {["PNG", "JPG", "JPEG", "WEBP"].map((format) => (
                <span
                  key={format}
                  className="rounded-md border border-[#d8e2ef] bg-white px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#71819b]"
                >
                  {format}
                </span>
              ))}

              <span className="text-[10px] text-[#71819b]">
                Maximum 10MB per image
              </span>
            </div>
          </div>

          {/* Selected Images */}
          <div className="mt-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#172b52]">
                  Selected Images
                </h3>
                <p className="mt-1 text-xs text-[#71819b]">
                  Review your selected files before uploading.
                </p>
              </div>

              {selectedImages.length > 0 && (
                <span className="rounded-lg border border-[#d8e2ef] bg-[#eef3fa] px-3 py-1.5 text-xs font-semibold text-[#172b52]">
                  {selectedImages.length}{" "}
                  {selectedImages.length === 1 ? "image" : "images"}
                </span>
              )}
            </div>

            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {selectedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative min-w-0 overflow-hidden rounded-xl border border-[#d8e2ef] bg-[#f8faff] transition-colors hover:border-[#9eb4d4]"
                  >
                    <div className="relative h-28 overflow-hidden bg-[#eef3fa] sm:h-32">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-slate-950/75 text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        aria-label={`Remove ${image.file.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="px-3 py-2.5">
                      <p
                        className="truncate text-xs font-medium text-[#172b52]"
                        title={image.file.name}
                      >
                        {image.file.name}
                      </p>

                      <p className="mt-1 text-[10px] text-[#71819b]">
                        {(image.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8e2ef] bg-[#f8faff] px-5 py-9 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8e2ef] bg-white text-[#8a9bb5]">
                  <ImagePlus size={22} />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#172b52]">
                  No images selected
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[#71819b]">
                  Your selected hierarchy images will appear here. Use the
                  Select Images button to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upload Information */}
      <section className="flex items-start gap-3 rounded-xl border border-[#d8e2ef] bg-[#eef3fa]/70 p-4">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-[#1b3768]"
        />

        <div>
          <h3 className="text-xs font-bold text-[#172b52]">
            File requirements
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#71819b]">
            Only image files are accepted. Supported formats are PNG, JPG,
            JPEG, and WEBP. Each image must be 10MB or smaller. Invalid files
            are rejected during selection.
          </p>
        </div>
      </section>
    </div>
  );
}

function UsersIcon() {
  return <Images size={23} strokeWidth={1.7} />;
}

export default EmployeeHierarchy;
