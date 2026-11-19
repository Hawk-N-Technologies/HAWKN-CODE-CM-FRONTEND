import axios from "axios";

/**
 * Phone / laptop alerts for THIS browser.
 * Works on laptops and Android. On iPhone/iPad it works only after the site
 * is added to the Home Screen (Share → Add to Home Screen).
 */

const API = "/api/notifications/push";
const axiosConfig = { withCredentials: true };

export const isAlertsSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// The server's key arrives in base64url; the browser wants raw bytes
function keyToBytes(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function getRegistration() {
  return navigator.serviceWorker.register("/sw.js");
}

async function getCurrentSubscription() {
  if (!isAlertsSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration ? registration.pushManager.getSubscription() : null;
}

/**
 * "unsupported" | "not-setup" (server has no keys) | "blocked" (user said no)
 * | "on" | "off"
 */
export async function getAlertsState() {
  if (!isAlertsSupported()) return "unsupported";

  const { data } = await axios.get(`${API}/public-key`, axiosConfig);
  if (!data.data?.enabled) return "not-setup";

  if (Notification.permission === "denied") return "blocked";

  const subscription = await getCurrentSubscription();

  if (subscription && Notification.permission === "granted") {
    // Make sure this device is linked to whoever is logged in now
    await axios.post(`${API}/subscribe`, { subscription: subscription.toJSON() }, axiosConfig);
    return "on";
  }

  return "off";
}

export async function turnOnAlerts() {
  const { data } = await axios.get(`${API}/public-key`, axiosConfig);
  const publicKey = data.data?.publicKey;
  if (!publicKey) throw new Error("Phone/laptop alerts are not set up yet.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Alerts are blocked. Allow notifications for this site in your browser settings.");
  }

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(publicKey),
    }));

  await axios.post(`${API}/subscribe`, { subscription: subscription.toJSON() }, axiosConfig);
}

export async function turnOffAlerts() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;

  await axios.post(`${API}/unsubscribe`, { endpoint: subscription.endpoint }, axiosConfig);
  await subscription.unsubscribe();
}

// On logout: this device must stop getting this person's alerts
export async function forgetThisDevice() {
  try {
    await turnOffAlerts();
  } catch {
    // logging out must never fail because of alerts
  }
}
