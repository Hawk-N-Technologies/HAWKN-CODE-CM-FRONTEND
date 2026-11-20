import { useEffect, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import PageHeader from "../../components/layout/PageHeader";
import { Network } from "lucide-react";
import { getErrorMessage } from "../../services/developerProjectService";

/**
 * HR → Employee Hierarchy (read-only).
 * Shows the hierarchy images the Admin maintains for the company.
 */

const HIERARCHY_API = "/api/company/hierarchy";
const imageUrl = (uuid) => `${HIERARCHY_API}/${uuid}/file`;

function EmployeeHierarchy() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    axios
      .get(HIERARCHY_API, { withCredentials: true })
      .then((response) => {
        if (!ignore) setImages(response.data.data || []);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(getErrorMessage(error, "Couldn't load the employee hierarchy."));
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="HR MANAGEMENT"
        title="Employee Hierarchy"
        description="The company hierarchy, as maintained by the Admin."
        icon={Network}
        actions={
          !isLoading &&
          !loadError && (
            <Badge tone="info">
              {images.length} {images.length === 1 ? "image" : "images"}
            </Badge>
          )
        }
      />

      {isLoading && (
        <p className="text-sm text-cm-text-muted">Loading hierarchy…</p>
      )}

      {!isLoading && loadError && (
        <p className="rounded-cm-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && images.length === 0 && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-cm-text">No hierarchy uploaded yet</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            The Admin can upload it from Admin → Employee Hierarchy.
          </p>
        </section>
      )}

      {!isLoading && !loadError && images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {images.map((image) => (
            <figure
              key={image.uuid}
              className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm"
            >
              <a
                href={imageUrl(image.uuid)}
                target="_blank"
                rel="noopener noreferrer"
                title="Open full size"
              >
                <img
                  src={imageUrl(image.uuid)}
                  alt={image.originalFileName}
                  className="max-h-[70vh] w-full bg-white object-contain"
                  loading="lazy"
                />
              </a>
              <figcaption className="border-t border-cm-border px-4 py-2 text-xs text-cm-text-muted">
                {image.originalFileName}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployeeHierarchy;
