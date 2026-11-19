import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

import Button from "../common/Button";
import { showToast } from "../common/Toast";
import {
  getAlertsState,
  turnOffAlerts,
  turnOnAlerts,
} from "../../services/pushAlerts";

/**
 * "Phone / laptop alerts" switch for this browser, shown on every
 * Notifications page.
 */

const TEXT = {
  loading: "Checking this device…",
  on: "On for this device. You'll get a pop-up even when the website is closed.",
  off: "Get a pop-up on this phone or laptop for urgent tasks and announcements, even when the website is closed.",
  blocked: "Blocked in this browser. Allow notifications for this site in your browser settings, then refresh.",
  unsupported: "This browser can't show alerts. On iPhone/iPad, add the site to your Home Screen first (Share → Add to Home Screen).",
  "not-setup": "Phone/laptop alerts haven't been set up on the server yet.",
};

export default function PushAlertsCard() {
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getAlertsState()
      .then((value) => {
        if (!ignore) setState(value);
      })
      .catch(() => {
        if (!ignore) setState("off");
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (state === "on") {
        await turnOffAlerts();
        showToast.success("Alerts turned off for this device.");
      } else {
        await turnOnAlerts();
        showToast.success("Alerts turned on for this device.");
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || error.message || "Couldn't change alerts.",
      );
    } finally {
      setBusy(false);
      setReloadKey((key) => key + 1);
    }
  };

  const canToggle = state === "on" || state === "off";

  return (
    <section className="flex flex-col gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <BellRing size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-cm-text">Phone / laptop alerts</h2>
          <p className="mt-0.5 text-xs leading-5 text-cm-text-muted">{TEXT[state]}</p>
        </div>
      </div>

      {canToggle && (
        <Button
          size="sm"
          variant={state === "on" ? "outline" : "primary"}
          onClick={toggle}
          disabled={busy}
        >
          {busy ? "Please wait…" : state === "on" ? "Turn off" : "Turn on alerts"}
        </Button>
      )}
    </section>
  );
}
