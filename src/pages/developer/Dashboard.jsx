import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import AttendanceButton from "../../components/common/AttendanceButton";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

const projects = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    progress: 72,
    status: "In Progress",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    progress: 79,
    status: "In Progress",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [canSwitchToLead, setCanSwitchToLead] = useState(false);
  const [checkingModes, setCheckingModes] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkModes = async () => {
      try {
        const response = await axios.get("/api/auth/me/modes", {
          withCredentials: true,
        });

        if (mounted) {
          const modes =
            response.data?.data?.modes ?? response.data?.modes ?? [];
          setCanSwitchToLead(
            Array.isArray(modes) &&
              modes.some(
                (mode) => String(mode).toLowerCase() === "project_lead",
              ),
          );
        }
      } catch {
        if (mounted) setCanSwitchToLead(false);
      } finally {
        if (mounted) setCheckingModes(false);
      }
    };

    checkModes();
    return () => {
      mounted = false;
    };
  }, []);

  const switchToLead = async () => {
    setSwitching(true);

    try {
      const response = await axios.get("/api/auth/mee", {
        withCredentials: true,
      });

      if (response.data?.data?.allowed !== true) {
        throw new Error("You are not assigned as a project lead.");
      }

      navigate("/project-lead/dashboard");
      showToast.success("Switched to Project Lead dashboard.");
    } catch (error) {
      showToast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to switch dashboard.",
      );
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Developer Dashboard
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            View your projects, tasks, testing and development progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AttendanceButton />
          {!checkingModes && canSwitchToLead && (
            <Button
              type="button"
              variant="outline"
              loading={switching}
              disabled={switching}
              leftIcon={<ArrowRightLeft size={16} />}
              onClick={switchToLead}
            >
              Switch to Project Lead
            </Button>
          )}
          {checkingModes && (
            <span className="inline-flex items-center gap-2 text-xs text-cm-text-muted">
              <LoaderCircle size={14} className="animate-spin" />
              Checking access
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Projects" value="2" />
        <StatCard label="My Tasks" value="12" />
        <StatCard label="Completed Tasks" value="18" />
        <StatCard label="Open Bugs" value="4" />
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">My Projects</h2>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-cm-md border border-cm-border p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-cm-text-muted">{project.id}</p>
                  <h3 className="mt-1 font-medium text-cm-text">
                    {project.name}
                  </h3>
                </div>
                <Badge tone="info">{project.status}</Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-cm-text-muted">
                {project.progress}% complete
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
