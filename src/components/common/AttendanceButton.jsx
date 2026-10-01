import { useEffect, useState } from "react";
import axios from "axios";

import Button from "./Button";
import { showToast } from "./Toast";
import Loader from "./Loader";

function getTodayKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMinutes() {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentDay() {
  return new Date().getDay();
}

function getAttendanceState(attendance) {
  const currentMinutes = getCurrentMinutes();
  const day = getCurrentDay();

  const firstHalfStart = 10 * 60;
  const firstHalfEnd = 14 * 60;

  const secondHalfStart = 14 * 60;
  const secondHalfEnd = 18 * 60;

  // Sunday
  if (day === 0) {
    return {
      session: null,
      label: "Attendance Closed",
      disabled: true,
    };
  }

  // Saturday - first half only
  if (day === 6) {
    if (currentMinutes >= firstHalfStart && currentMinutes < firstHalfEnd) {
      return {
        session: "FIRST_HALF",
        label: attendance.FIRST_HALF ? "First Half Marked" : "Mark First Half",
        disabled: attendance.FIRST_HALF,
      };
    }

    return {
      session: null,
      label: "Attendance Closed",
      disabled: true,
    };
  }

  // Monday - Friday: First half
  if (currentMinutes >= firstHalfStart && currentMinutes < firstHalfEnd) {
    return {
      session: "FIRST_HALF",
      label: attendance.FIRST_HALF ? "First Half Marked" : "Mark First Half",
      disabled: attendance.FIRST_HALF,
    };
  }

  // Monday - Friday: Second half
  if (currentMinutes >= secondHalfStart && currentMinutes < secondHalfEnd) {
    return {
      session: "SECOND_HALF",
      label: attendance.SECOND_HALF ? "Second Half Marked" : "Mark Second Half",
      disabled: attendance.SECOND_HALF,
    };
  }

  return {
    session: null,
    label: "Attendance Closed",
    disabled: true,
  };
}

function AttendanceButton() {
  const [attendance, setAttendance] = useState({
    FIRST_HALF: false,
    SECOND_HALF: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setIsLoading(true);

        const today = getTodayKey();

        const storedAttendance = JSON.parse(
          localStorage.getItem("hr_attendance") || "{}",
        );

        const todayAttendance = storedAttendance[today];

        if (todayAttendance) {
          setAttendance({
            FIRST_HALF: Boolean(todayAttendance.FIRST_HALF),
            SECOND_HALF: Boolean(todayAttendance.SECOND_HALF),
          });
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);

        showToast.error("Unable to load attendance.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const handleAttendance = async () => {
    const attendanceState = getAttendanceState(attendance);

    if (!attendanceState.session) {
      showToast.error("Attendance is not available at this time.");
      return;
    }

    if (attendanceState.disabled || isMarking || isLoading) {
      return;
    }

    try {
      setIsMarking(true);

      const response = await axios.post(
        "/api/attendance/mark",
        {},
        {
          withCredentials: true,
        },
      );

      if (!response.data.success) {
        showToast.error(response.data.message || "Unable to mark attendance.");
        return;
      }

      const today = getTodayKey();

      const updatedAttendance = {
        ...attendance,
        [attendanceState.session]: true,
      };

      const storedAttendance = JSON.parse(
        localStorage.getItem("hr_attendance") || "{}",
      );

      storedAttendance[today] = updatedAttendance;

      localStorage.setItem("hr_attendance", JSON.stringify(storedAttendance));

      setAttendance(updatedAttendance);

      showToast.success(
        response.data.message || "Attendance marked successfully.",
      );
    } catch (error) {
      console.error("Mark attendance error:", error);

      showToast.error(
        error.response?.data?.message || "Unable to mark attendance.",
      );
    } finally {
      setIsMarking(false);
    }
  };

  const attendanceState = getAttendanceState(attendance);

  /*
   * Initial loading
   */
  if (isLoading) {
    return (
      <Button disabled>
        <div className="flex items-center gap-2">
          <Loader size="sm" />
          <span>Loading...</span>
        </div>
      </Button>
    );
  }

  /*
   * Marking attendance
   */
  if (isMarking) {
    return (
      <Button disabled>
        <div className="flex items-center gap-2">
          <Loader size="sm" />
          <span>Marking...</span>
        </div>
      </Button>
    );
  }

  return (
    <Button onClick={handleAttendance} disabled={attendanceState.disabled}>
      {attendanceState.label}
    </Button>
  );
}

export default AttendanceButton;
