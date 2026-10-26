import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import { showAlert } from "../../components/common/Alert";
import axios from "axios";

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Holiday() {
  const [holidays, setHolidays] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState(null);
  const [form, setForm] = useState({ date: "", name: "", paid: true });

  const getAllHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/company/holidays", {
        withCredentials: true,
      });
      if (res.status === 200) setHolidays(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      showToast.error(
        error.response?.data?.message || "Failed to load holidays.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllHolidays();
  }, []);

  // Close the modal with Escape and prevent the page from scrolling behind it.
  useEffect(() => {
    if (!showForm) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) setShowForm(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showForm, submitting]);

  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm({ date: "", name: "", paid: true });
  }

  function closeForm() {
    if (submitting) return;
    setShowForm(false);
    resetForm();
  }

  async function addHoliday(event) {
    event.preventDefault();
    if (!form.date || !form.name.trim()) {
      showToast.error("Holiday date and name are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        "/api/company/holidays",
        { holidayDate: form.date, name: form.name.trim(), isPaid: form.paid },
        { withCredentials: true },
      );
      if (res.status === 201 || res.status === 200) {
        showToast.success("Holiday added successfully.");
        resetForm();
        setShowForm(false);
        await getAllHolidays();
      }
    } catch (error) {
      console.error("Failed to create holiday:", error);
      showToast.error(
        error.response?.data?.message || "Failed to add holiday.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteHoliday(uuid, holidayName) {
    const result = await showAlert.confirm({
      title: "Delete holiday?",
      text: `Are you sure you want to delete "${holidayName}"? This action cannot be undone.`,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      setDeletingUuid(uuid);
      const res = await axios.delete(`/api/company/holidays/${uuid}`, {
        withCredentials: true,
      });
      if (res.status === 200) {
        setHolidays((previous) =>
          previous.filter((holiday) => holiday.uuid !== uuid),
        );
        showToast.success("Holiday removed successfully.");
      }
    } catch (error) {
      console.error("Failed to delete holiday:", error);
      showToast.error(
        error.response?.data?.message || "Failed to remove holiday.",
      );
    } finally {
      setDeletingUuid(null);
    }
  }

  const filteredHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return holidays;
    return holidays.filter(
      (holiday) =>
        holiday.name?.toLowerCase().includes(query) ||
        holiday.holidayDate?.includes(query),
    );
  }, [holidays, search]);

  const columns = [
    {
      key: "holidayDate",
      header: "Date",
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-cm-text">
          {formatDate(row.holidayDate)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Holiday",
      render: (row) => <p className="font-medium text-cm-text">{row.name}</p>,
    },
    {
      key: "isPaid",
      header: "Type",
      render: (row) => (
        <Badge tone={row.isPaid ? "success" : "warning"}>
          {row.isPaid ? "Paid Holiday" : "Unpaid Holiday"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const isDeleting = deletingUuid === row.uuid;
        return (
          <Button
            size="sm"
            variant="danger"
            disabled={deletingUuid !== null}
            onClick={() => deleteHoliday(row.uuid, row.name)}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Company Holidays</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage company holidays and non-working dates.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Holiday</Button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting)
              closeForm();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cm-border bg-cm-card shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cm-border bg-cm-card px-6 py-5">
              <div>
                <h2
                  id="holiday-modal-title"
                  className="text-lg font-semibold text-cm-text"
                >
                  Add Company Holiday
                </h2>
                <p className="mt-1 text-sm text-cm-text-muted">
                  Add a date to the company holiday calendar.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                disabled={submitting}
                onClick={closeForm}
                className="rounded-lg p-2 text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-text disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addHoliday} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Holiday Date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => handleChange("date", event.target.value)}
                />
                <Input
                  label="Holiday Name"
                  required
                  placeholder="e.g. Diwali"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-cm-border p-4 text-sm text-cm-text transition hover:bg-cm-bg">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(event) =>
                    handleChange("paid", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#000052]"
                />
                <span>
                  <span className="block font-medium">Paid Holiday</span>
                  <span className="mt-0.5 block text-xs text-cm-text-muted">
                    Employees receive their regular pay for this holiday.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-cm-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={closeForm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Holiday"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search holiday name or date…"
      />

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-cm-text">
              Holiday Calendar
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              {filteredHolidays.length} holiday
              {filteredHolidays.length === 1 ? "" : "s"} found
            </p>
          </div>
          <Badge tone={holidays.length > 0 ? "success" : "neutral"}>
            {holidays.length} Holidays
          </Badge>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader />
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredHolidays}
              emptyMessage="No holidays found."
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default Holiday;
