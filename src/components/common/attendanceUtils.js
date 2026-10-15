export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function formatCheckIn(value) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch {
    return null;
  }
}

/*
 * Returns true when the date is after today.
 *
 * This is used by the calendar so future dates
 * don't display attendance or absence.
 */
export function isFutureDate(dateString) {
  if (!dateString) {
    return false;
  }

  const today = new Date();

  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [year, month, day] = dateString.split("-").map(Number);

  const targetDate = new Date(year, month - 1, day);

  return targetDate > currentDate;
}

export function getMonthDays(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => index + 1);
}

export function getCalendarStartOffset(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

export function getStatusLabel(session) {
  if (!session) {
    return "—";
  }

  if (session.type === "ATTENDANCE") {
    return session.status || "Attendance";
  }

  if (session.type === "LEAVE") {
    return session.status || "Leave";
  }

  if (session.type === "HOLIDAY") {
    return session.status || "Holiday";
  }

  if (session.type === "WEEKEND") {
    return "Weekend";
  }

  return session.status || session.type || "—";
}

export function getOverallStatus(day) {
  if (!day) {
    return "—";
  }

  if (day.overallStatus) {
    return day.overallStatus;
  }

  const firstHalf = day.sessions?.firstHalf;
  const secondHalf = day.sessions?.secondHalf;

  if (firstHalf?.type === "WEEKEND" || secondHalf?.type === "WEEKEND") {
    return "Weekend";
  }

  if (firstHalf?.type === "HOLIDAY" || secondHalf?.type === "HOLIDAY") {
    return "Holiday";
  }

  const firstStatus = firstHalf?.status;
  const secondStatus = secondHalf?.status;

  if (firstStatus === "Present" && secondStatus === "Present") {
    return "Present";
  }

  if (firstStatus === "Absent" && secondStatus === "Absent") {
    return "Absent";
  }

  if (
    (firstStatus === "Present" && secondStatus === "Absent") ||
    (firstStatus === "Absent" && secondStatus === "Present")
  ) {
    return "Half Day";
  }

  if (firstHalf?.type === "LEAVE" || secondHalf?.type === "LEAVE") {
    if (firstHalf?.isPaid || secondHalf?.isPaid) {
      return "Paid Leave";
    }

    return "Unpaid Leave";
  }

  return firstStatus || secondStatus || "—";
}

export function getOverallTone(status) {
  switch (status) {
    case "Present":
      return "success";

    case "Half Day":
      return "warning";

    case "Absent":
      return "danger";

    case "Paid Leave":
      return "success";

    case "Unpaid Leave":
      return "warning";

    case "Leave":
      return "warning";

    case "Holiday":
      return "info";

    case "Weekend":
      return "neutral";

    default:
      return "neutral";
  }
}

export function getSessionColor(session) {
  if (!session) {
    return "border-cm-border bg-cm-bg text-cm-text-muted";
  }

  if (session.type === "WEEKEND") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (session.type === "HOLIDAY") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (session.type === "LEAVE") {
    if (session.isPaid) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (session.status === "Present") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (session.status === "Absent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-cm-border bg-cm-card text-cm-text";
}

export function getSessionShortLabel(session) {
  if (!session) {
    return "—";
  }

  if (session.type === "ATTENDANCE") {
    if (session.status === "Present") {
      return "Present";
    }

    if (session.status === "Absent") {
      return "Absent";
    }
  }

  if (session.type === "LEAVE") {
    return session.isPaid ? "Paid Leave" : "Unpaid Leave";
  }

  if (session.type === "HOLIDAY") {
    return "Holiday";
  }

  if (session.type === "WEEKEND") {
    return "Weekend";
  }

  return getStatusLabel(session);
}

export function getDayCardClass(day, isToday) {
  const status = getOverallStatus(day);

  let statusClass = "border-cm-border bg-cm-card";

  switch (status) {
    case "Present":
      statusClass = "border-green-200 bg-green-50/50";
      break;

    case "Absent":
      statusClass = "border-red-200 bg-red-50/40";
      break;

    case "Half Day":
      statusClass = "border-yellow-200 bg-yellow-50/40";
      break;

    case "Paid Leave":
      statusClass = "border-green-200 bg-green-50/40";
      break;

    case "Unpaid Leave":
      statusClass = "border-orange-200 bg-orange-50/40";
      break;

    case "Holiday":
      statusClass = "border-blue-200 bg-blue-50/40";
      break;

    case "Weekend":
      statusClass = "border-slate-200 bg-slate-50";
      break;

    default:
      break;
  }

  if (isToday) {
    statusClass += " ring-2 ring-[#000052]/20";
  }

  return statusClass;
}
