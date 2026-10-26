import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Globe2,
  Mail,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import { required, EMAIL_PATTERN } from "../../utils/validators";

const API_PROFILE = "/api/company/profile";
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

const DEFAULT_VALUES = {
  officialName: "Hawk'N Technologies",
  officialEmail: "hello@hawkn.dev",
  vision:
    "To build innovative technology solutions that help businesses grow, operate efficiently, and create meaningful digital experiences.",
  mission:
    "Our mission is to deliver reliable, scalable, and user-focused technology solutions while maintaining quality, transparency, and long-term relationships with our clients.",
  blog: "",
  companyStory: "",
  uuid: "",
};

const SECTIONS = [
  { id: "identity", label: "Company identity", icon: Building2 },
  { id: "vision", label: "Vision & mission", icon: Target },
  { id: "our-story", label: "Our Story", icon: FileText },
  { id: "blog", label: "Company content", icon: Globe2 },
];

const PANEL =
  "rounded-2xl border border-[#d8e2ef] bg-[#f8faff] shadow-[0_3px_14px_rgba(20,40,75,0.035)]";

const FIELD_SURFACE = "rounded-xl border border-[#d8e2ef] bg-[#eef3fa]/70";

function SectionHeading({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
          {eyebrow}
        </p>
        <h2 className="text-sm font-semibold text-cm-navy-950 sm:text-base">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#71819b] sm:text-[13px]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoNote({ children }) {
  return (
    <div className={`${FIELD_SURFACE} flex items-start gap-2.5 p-3.5`}>
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#c8d7eb] text-[10px] font-bold text-cm-navy-950">
        i
      </span>
      <p className="text-xs leading-5 text-[#71819b]">{children}</p>
    </div>
  );
}

function EmptyChecklistMark({ complete }) {
  return (
    <span
      className={[
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        complete
          ? "border-[#c7dcff] bg-[#e0edff] text-cm-navy-950"
          : "border-[#d8e2ef] bg-[#eef3fa] text-[#71819b]",
      ].join(" ")}
    >
      {complete ? (
        <Check size={11} strokeWidth={2.5} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
    </span>
  );
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getDocumentExtension(filename = "") {
  const name = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.find((extension) => name.endsWith(extension)) || "";
}

function validateDocument(file) {
  if (!file) {
    return "Select a document to upload.";
  }

  const extension = getDocumentExtension(file.name);

  if (!extension) {
    return "Only PDF, DOCX, and TXT documents are supported.";
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return "The document must be 10 MB or smaller.";
  }

  // Some browsers report an empty MIME type for valid local files.
  // The backend performs its own extension and MIME validation.
  if (file.type && !ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return "The selected file has an unsupported file type.";
  }

  return "";
}

function CompanyProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isOpeningDocument, setIsOpeningDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    name: null,
    url: null,
  });

  const fileInputRef = useRef(null);
  const savedValuesRef = useRef({ ...DEFAULT_VALUES });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const values = watch();
  const blog = watch("blog") ?? "";
  const companyStory = watch("companyStory") ?? "";
  const companyName = watch("officialName") || DEFAULT_VALUES.officialName;
  const companyEmail = watch("officialEmail") || DEFAULT_VALUES.officialEmail;

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const response = await axios.get(API_PROFILE, {
        withCredentials: true,
      });

      const data = response.data?.data;

      if (!data) {
        throw new Error("Company profile data is missing.");
      }

      const profile = {
        officialName: data.officialCompanyName ?? DEFAULT_VALUES.officialName,
        officialEmail: data.officialEmail ?? DEFAULT_VALUES.officialEmail,
        vision: data.vision ?? DEFAULT_VALUES.vision,
        mission: data.mission ?? DEFAULT_VALUES.mission,

        // The backend exposes blogContent as an alias for
        // whatPeopleShouldKnow to preserve the existing editor.
        blog: data.blogContent ?? data.whatPeopleShouldKnow ?? "",

        companyStory: data.companyStory ?? "",
        uuid: data.uuid ?? "",
      };

      savedValuesRef.current = profile;
      reset(profile);

      setDocumentInfo({
        name: data.companyStoryDocumentName ?? null,
        url: data.companyStoryDocumentUrl ?? null,
      });

      setSelectedDocument(null);
    } catch (error) {
      console.error("Failed to load company profile:", error);
      setLoadError(true);

      showToast.error(
        getErrorMessage(error, "Couldn't load the company profile."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onSubmit = async (formValues) => {
    if (!formValues.uuid) {
      showToast.error("Company profile ID is missing. Reload the profile.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        officialCompanyName: formValues.officialName.trim(),
        officialEmail: formValues.officialEmail.trim(),
        vision: formValues.vision?.trim() ?? "",
        mission: formValues.mission?.trim() ?? "",

        // Existing editor compatibility mapping handled by the backend.
        blogContent: formValues.blog ?? "",

        // Stored separately in company_profiles.company_story.
        companyStory: formValues.companyStory ?? "",
      };

      const response = await axios.put(
        `${API_PROFILE}/${encodeURIComponent(formValues.uuid)}`,
        payload,
        { withCredentials: true },
      );

      const data = response.data?.data;

      const persistedValues = {
        ...formValues,
        officialName:
          data?.officialCompanyName ?? payload.officialCompanyName,
        officialEmail: data?.officialEmail ?? payload.officialEmail,
        vision: data?.vision ?? payload.vision,
        mission: data?.mission ?? payload.mission,
        blog: data?.blogContent ?? payload.blogContent,
        companyStory: data?.companyStory ?? payload.companyStory,
        uuid: data?.uuid ?? formValues.uuid,
      };

      savedValuesRef.current = persistedValues;
      reset(persistedValues);

      // Refresh document metadata from the response if available.
      if (data) {
        setDocumentInfo((previous) => ({
          name: data.companyStoryDocumentName ?? previous.name,
          url: data.companyStoryDocumentUrl ?? previous.url,
        }));
      }

      showToast.success("Company profile updated successfully.");
    } catch (error) {
      console.error("Failed to save company profile:", error);

      showToast.error(
        getErrorMessage(
          error,
          "Couldn't save the company profile. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset(savedValuesRef.current);
    showToast.success("Unsaved changes discarded.");
  };

  const handleSelectDocument = (event) => {
    const file = event.target.files?.[0] ?? null;

    // Allow selecting the same file again after a failed upload.
    event.target.value = "";

    if (!file) {
      setSelectedDocument(null);
      return;
    }

    const validationMessage = validateDocument(file);

    if (validationMessage) {
      setSelectedDocument(null);
      showToast.error(validationMessage);
      return;
    }

    setSelectedDocument(file);
  };

  const handleUploadDocument = async () => {
    const uuid = values.uuid;

    if (!uuid) {
      showToast.error("Company profile ID is missing. Reload the profile.");
      return;
    }

    if (!selectedDocument) {
      showToast.error("Select a document before uploading.");
      return;
    }

    const validationMessage = validateDocument(selectedDocument);

    if (validationMessage) {
      showToast.error(validationMessage);
      return;
    }

    const formData = new FormData();

    // Must match uploadCompanyStory.single("companyStoryDocument")
    // in the backend middleware.
    formData.append("companyStoryDocument", selectedDocument);

    setIsUploadingDocument(true);

    try {
      const response = await axios.post(
        `${API_PROFILE}/${encodeURIComponent(uuid)}/story-document`,
        formData,
        {
          withCredentials: true,
        },
      );

      const uploaded = response.data?.data;

      if (!uploaded?.companyStoryDocumentName) {
        throw new Error(
          "The server did not return the uploaded document's filename.",
        );
      }

      setDocumentInfo({
        name: uploaded.companyStoryDocumentName,
        url:
          uploaded.companyStoryDocumentUrl ??
          `${API_PROFILE}/${encodeURIComponent(uuid)}/story-document`,
      });

      setSelectedDocument(null);

      showToast.success("Our Story document uploaded successfully.");
    } catch (error) {
      console.error("Failed to upload Our Story document:", error);

      showToast.error(
        getErrorMessage(
          error,
          "Couldn't upload the document. Please try again.",
        ),
      );
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleOpenDocument = async () => {
    const uuid = values.uuid;

    if (!uuid || !documentInfo.name) {
      showToast.error("No uploaded Our Story document is available.");
      return;
    }

    setIsOpeningDocument(true);

    let objectUrl = null;

    try {
      const endpoint =
        documentInfo.url ||
        `${API_PROFILE}/${encodeURIComponent(uuid)}/story-document`;

      // Fetch as a Blob so the browser sends the authenticated session
      // through Axios, rather than relying on a direct unauthenticated link.
      const response = await axios.get(endpoint, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = response.data;

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("The server returned an empty document.");
      }

      const extension = getDocumentExtension(documentInfo.name);
      const isDocx = extension === ".docx";

      const contentType =
        response.headers?.["content-type"] ||
        blob.type ||
        "application/octet-stream";

      const fileBlob = new Blob([blob], { type: contentType });
      objectUrl = URL.createObjectURL(fileBlob);

      if (isDocx) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = documentInfo.name;
        document.body.appendChild(link);
        link.click();
        link.remove();

        showToast.success("Document download started.");
      } else {
        // Open PDF/TXT in a separate tab. The blob URL contains the
        // document fetched through the authenticated backend endpoint.
        const newWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

        if (!newWindow) {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = documentInfo.name;
          document.body.appendChild(link);
          link.click();
          link.remove();

          showToast.error(
            "Your browser blocked the new tab, so the document download was started instead.",
          );
        }
      }

      // Keep the object URL alive long enough for the browser to load it.
      window.setTimeout(() => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }, 60_000);

      objectUrl = null;
    } catch (error) {
      console.error("Failed to open Our Story document:", error);

      showToast.error(
        getErrorMessage(
          error,
          "Couldn't open the document. Check that it still exists on the server.",
        ),
      );
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setIsOpeningDocument(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] flex-col gap-6">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-[#e4ebf5]" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#e4ebf5]" />
        </div>

        <div className={`${PANEL} flex flex-1 items-center justify-center`}>
          <Loader context="section" label="Loading company profile..." />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`${PANEL} flex min-h-[45vh] flex-col items-center justify-center px-6 py-12 text-center`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
          <Building2 size={25} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-cm-navy-950">
          Couldn't load your company profile
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#71819b]">
          Check your connection and try loading your company information again.
        </p>

        <div className="mt-5">
          <Button type="button" onClick={loadProfile}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6 pb-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-[#71819b]"
      >
        <span>Settings</span>
        <ChevronRight size={13} />
        <span className="font-medium text-cm-navy-950">Company profile</span>
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950 shadow-sm">
            <Building2 size={26} strokeWidth={1.7} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-cm-navy-950 sm:text-[28px]">
                Company profile
              </h1>

              <Badge tone="info" size="sm">
                Workspace
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71819b]">
              Manage your company identity, purpose, story, and published
              content from one place.
            </p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2.5 rounded-xl border border-[#d8e2ef] bg-[#f8faff] px-3.5 py-2.5">
          <span
            className={[
              "h-2 w-2 rounded-full",
              isDirty ? "bg-amber-500" : "bg-cm-blue-600",
            ].join(" ")}
          />

          <span className="text-xs font-medium text-cm-navy-950">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
      </header>

      <section className={`${PANEL} relative isolate overflow-hidden`}>
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
            <Building2 size={30} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71819b]">
              Your organization
            </p>

            <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-cm-navy-950">
              {companyName}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-[#71819b]">
                <Mail size={14} className="shrink-0" />
                <span className="break-all">{companyEmail}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-[#71819b]">
                <Globe2 size={14} />
                Company settings
              </span>
            </div>
          </div>

          <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#d8e2ef] bg-[#eef3fa] px-3 py-2.5">
            <Sparkles size={16} className="text-cm-navy-950" />
            <span className="text-xs font-medium text-cm-navy-950">
              Organization details
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 -z-0 h-56 w-56 rounded-full border border-[#d8e2ef]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-12 -z-0 h-40 w-40 rounded-full border border-[#d8e2ef]"
        />
      </section>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_270px]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          {/* Company identity */}
          <section id="identity" className={`${PANEL} scroll-mt-6`}>
            <div className="border-b border-[#d8e2ef] p-5 sm:p-6">
              <SectionHeading
                icon={Building2}
                eyebrow="01 / Identity"
                title="Company information"
                description="The official details used to identify your organization."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <Input
                label="Official company name"
                required
                placeholder="Enter your registered company name"
                error={errors.officialName?.message}
                {...register("officialName", {
                  required: required("Company name"),
                  validate: (value) =>
                    Boolean(value?.trim()) || "Company name is required.",
                })}
              />

              <Input
                label="Official email address"
                type="email"
                required
                placeholder="name@company.com"
                error={errors.officialEmail?.message}
                {...register("officialEmail", {
                  required: required("Official email"),
                  pattern: {
                    value:
                      EMAIL_PATTERN?.value instanceof RegExp
                        ? EMAIL_PATTERN.value
                        : EMAIL_PATTERN,
                    message:
                      EMAIL_PATTERN?.message || "Enter a valid email address.",
                  },
                })}
              />
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <InfoNote>
                Use your official company name and a monitored business email
                address to keep your organization details accurate.
              </InfoNote>
            </div>
          </section>

          {/* Vision and mission */}
          <section id="vision" className={`${PANEL} scroll-mt-6`}>
            <div className="border-b border-[#d8e2ef] p-5 sm:p-6">
              <SectionHeading
                icon={Target}
                eyebrow="02 / Direction"
                title="Vision & mission"
                description="Communicate your long-term ambition and how your organization delivers on it."
              />
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className={`${FIELD_SURFACE} p-4 sm:p-5`}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950">
                    <Eye size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-cm-navy-950">
                      Our vision
                    </h3>
                    <p className="mt-1 text-xs text-[#71819b]">
                      The future your organization wants to create.
                    </p>
                  </div>
                </div>

                <Input
                  label="Vision statement"
                  multiline
                  rows={4}
                  placeholder="Describe the long-term future you're working toward..."
                  helperText="Keep it clear, memorable, and focused on your long-term direction."
                  error={errors.vision?.message}
                  {...register("vision")}
                />
              </div>

              <div className={`${FIELD_SURFACE} p-4 sm:p-5`}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950">
                    <Target size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-cm-navy-950">
                      Our mission
                    </h3>
                    <p className="mt-1 text-xs text-[#71819b]">
                      The work and values that guide your organization.
                    </p>
                  </div>
                </div>

                <Input
                  label="Mission statement"
                  multiline
                  rows={4}
                  placeholder="Describe how your company delivers on its vision..."
                  helperText="Focus on what you do, who you serve, and the value you deliver."
                  error={errors.mission?.message}
                  {...register("mission")}
                />
              </div>
            </div>
          </section>

          {/* Our Story */}
          <section id="our-story" className={`${PANEL} scroll-mt-6`}>
            <div className="border-b border-[#d8e2ef] p-5 sm:p-6">
              <SectionHeading
                icon={FileText}
                eyebrow="03 / Company story"
                title="Our Story"
                description="Write your company's story and upload a supporting document that can be opened later."
              />
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="company-story"
                  className="mb-2 block text-sm font-semibold text-cm-navy-950"
                >
                  Company story
                </label>

                <textarea
                  id="company-story"
                  rows={8}
                  value={companyStory}
                  onChange={(event) =>
                    setValue("companyStory", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Tell the story of your company: how it started, what problem it solves, what makes it different, and where it is going..."
                  className="w-full resize-y rounded-xl border border-[#d8e2ef] bg-white px-4 py-3 text-sm leading-6 text-cm-navy-950 outline-none transition focus:border-cm-blue-600 focus:ring-2 focus:ring-cm-blue-600/15"
                />
              </div>

              <div className={`${FIELD_SURFACE} p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#f8faff] text-cm-navy-950">
                    <Upload size={18} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-cm-navy-950">
                      Our Story document
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#71819b]">
                      Accepted formats: PDF, DOCX, and TXT. Maximum file size:
                      10 MB.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleSelectDocument}
                  disabled={isUploadingDocument || isSaving}
                  className="sr-only"
                  aria-label="Choose Our Story document"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingDocument || isSaving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload size={15} />
                      Choose document
                    </span>
                  </Button>

                  {selectedDocument && (
                    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#d8e2ef] bg-white px-3 py-2">
                      <FileText
                        size={15}
                        className="shrink-0 text-cm-navy-950"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs text-cm-navy-950">
                        {selectedDocument.name}
                      </span>

                      <button
                        type="button"
                        aria-label="Remove selected document"
                        title="Remove selected document"
                        disabled={isUploadingDocument}
                        onClick={() => setSelectedDocument(null)}
                        className="rounded-md p-1 text-[#71819b] hover:bg-[#eaf1fb] hover:text-cm-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {selectedDocument && (
                  <p className="mt-2 text-xs text-[#71819b]">
                    {(selectedDocument.size / (1024 * 1024)).toFixed(2)} MB
                    selected. Upload it to save it to the server.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    disabled={
                      !selectedDocument ||
                      isUploadingDocument ||
                      isSaving ||
                      !values.uuid
                    }
                    loading={isUploadingDocument}
                    onClick={handleUploadDocument}
                  >
                    <span className="inline-flex items-center gap-2">
                      {!isUploadingDocument && <Upload size={15} />}
                      Upload document
                    </span>
                  </Button>

                  {documentInfo.name && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isOpeningDocument || isUploadingDocument}
                      loading={isOpeningDocument}
                      onClick={handleOpenDocument}
                    >
                      <span className="inline-flex items-center gap-2">
                        {!isOpeningDocument && <Eye size={15} />}
                        View document
                      </span>
                    </Button>
                  )}
                </div>

                {documentInfo.name ? (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#c7dcff] bg-[#eaf1fb] p-3.5">
                    <FileText
                      size={18}
                      className="mt-0.5 shrink-0 text-cm-navy-950"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-cm-navy-950">
                        Uploaded document
                      </p>

                      <p className="mt-1 break-all text-sm text-cm-navy-950">
                        {documentInfo.name}
                      </p>

                    </div>

                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-cm-navy-950"
                    />
                  </div>
                ) : (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-[#c8d7eb] bg-white p-3.5">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-[#71819b]"
                    />

                    <p className="text-xs leading-5 text-[#71819b]">
                      No Our Story document is uploaded yet. Select a file and
                      upload it to attach a document to this company profile.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Existing Company Content editor */}
          <section id="blog" className={`${PANEL} scroll-mt-6`}>
            <div className="border-b border-[#d8e2ef] p-5 sm:p-6">
              <SectionHeading
                icon={Globe2}
                eyebrow="04 / Publishing"
                title="Company content"
                description="Create and maintain your company's existing blog or editorial content."
              />
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <InfoNote>
                  This editor remains separate from Our Story. Its content is
                  saved through the backend's blogContent compatibility mapping.
                </InfoNote>
              </div>

              <RichTextEditor
                label="Blog content"
                value={blog}
                onChange={(content) =>
                  setValue("blog", content, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.blog?.message}
              />
            </div>
          </section>

          {/* Save bar */}
          <div className="sticky bottom-3 z-20 rounded-2xl border border-[#d2deed] bg-[#f8faff]/95 p-3 shadow-[0_8px_30px_rgba(20,40,75,0.10)] backdrop-blur-md sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 px-1">
                {isDirty ? (
                  <Clock3
                    size={15}
                    className="mt-0.5 shrink-0 text-[#71819b]"
                  />
                ) : (
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0 text-cm-blue-600"
                  />
                )}

                <div>
                  <p className="text-xs font-semibold text-cm-navy-950">
                    {isDirty ? "Changes not saved" : "Everything is up to date"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#71819b]">
                    {isDirty
                      ? "Save your changes to update the company profile."
                      : "Your latest saved details are shown above."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !isDirty ||
                    isSaving ||
                    isUploadingDocument ||
                    isOpeningDocument
                  }
                  onClick={handleReset}
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw size={14} />
                    Discard
                  </span>
                </Button>

                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={
                    !isDirty ||
                    isSaving ||
                    isUploadingDocument ||
                    isOpeningDocument
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    {!isSaving && <Save size={15} />}
                    Save changes
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6">
          <section className={`${PANEL} p-5`}>
            <h2 className="text-sm font-semibold text-cm-navy-950">
              On this page
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#71819b]">
              Navigate directly to a section.
            </p>

            <nav className="mt-4 flex flex-col gap-1">
              {SECTIONS.map(({ id, label, icon: Icon }, index) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#71819b] transition-colors hover:bg-[#eaf1fb] hover:text-cm-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8e2ef] bg-[#eef3fa] text-cm-navy-950 transition-colors group-hover:bg-[#f8faff]">
                    <Icon size={16} />
                  </span>

                  <span className="min-w-0 flex-1 font-medium">{label}</span>

                  <span className="text-[10px] text-[#71819b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </a>
              ))}
            </nav>
          </section>

          <section className={`${PANEL} p-5`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
                <Check size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-cm-navy-950">
                  Profile checklist
                </h2>
                <p className="mt-0.5 text-[11px] text-[#71819b]">
                  Essential company details
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  label: "Company name",
                  complete: Boolean(values.officialName?.trim()),
                },
                {
                  label: "Official email",
                  complete: Boolean(values.officialEmail?.trim()),
                },
                {
                  label: "Vision statement",
                  complete: Boolean(values.vision?.trim()),
                },
                {
                  label: "Mission statement",
                  complete: Boolean(values.mission?.trim()),
                },
                {
                  label: "Our Story",
                  complete: Boolean(values.companyStory?.trim()),
                },
                {
                  label: "Story document",
                  complete: Boolean(documentInfo.name),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <EmptyChecklistMark complete={item.complete} />

                  <span className="min-w-0 flex-1 text-xs text-cm-navy-950">
                    {item.label}
                  </span>

                  <span className="text-[10px] text-[#71819b]">
                    {item.complete ? "Complete" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#d8e2ef] bg-[#eaf1fb]/70 p-5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={17} className="text-cm-navy-950" />
              <h2 className="text-sm font-semibold text-cm-navy-950">
                Profile tip
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#71819b]">
              Save your written story using Save changes. Uploading a document
              is a separate action. Keep both the text and supporting document
              current.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

export default CompanyProfile;
