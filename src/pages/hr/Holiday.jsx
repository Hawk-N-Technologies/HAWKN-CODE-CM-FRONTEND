import { useEffect, useMemo, useState } from "react";
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
  if (!value) {
    return "—";
  }

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

  const [form, setForm] = useState({
    date: "",
    name: "",
    paid: true,
  });

  // =========================
  // GET ALL HOLIDAYS
  // =========================
  const getAllHolidays = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/api/company/holidays", {
        withCredentials: true,
      });

      if (res.status === 200) {
        setHolidays(res.data.data || []);
      }
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

  // =========================
  // FORM CHANGE
  // =========================
  function handleChange(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      date: "",
      name: "",
      paid: true,
    });
  }

  // =========================
  // CREATE HOLIDAY
  // =========================
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
        {
          holidayDate: form.date,
          name: form.name.trim(),
          isPaid: form.paid,
        },
        {
          withCredentials: true,
        },
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

  // =========================
  // DELETE HOLIDAY
  // =========================
  async function deleteHoliday(uuid, holidayName) {
    const result = await showAlert.confirm({
      title: "Delete holiday?",
      text: `Are you sure you want to delete "${holidayName}"? This action cannot be undone.`,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

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

  // =========================
  // SEARCH
  // =========================
  const filteredHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return holidays;
    }

    return holidays.filter((holiday) => {
      return (
        holiday.name?.toLowerCase().includes(query) ||
        holiday.holidayDate?.includes(query)
      );
    });
  }, [holidays, search]);

  // =========================
  // TABLE
  // =========================
  const columns = [
    {
      key: "holidayDate",
      header: "Date",
      render: (row) => {
        return (
          <span className="whitespace-nowrap font-medium text-cm-text">
            {formatDate(row.holidayDate)}
          </span>
        );
      },
    },

    {
      key: "name",
      header: "Holiday",
      render: (row) => {
        return <p className="font-medium text-cm-text">{row.name}</p>;
      },
    },

    {
      key: "isPaid",
      header: "Type",
      render: (row) => {
        return (
          <Badge tone={row.isPaid ? "success" : "warning"}>
            {row.isPaid ? "Paid Holiday" : "Unpaid Holiday"}
          </Badge>
        );
      },
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
            disabled={isDeleting}
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Company Holidays</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Manage company holidays and non-working dates.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm((value) => !value);
          }}
        >
          {showForm ? "Close" : "Add Holiday"}
        </Button>
      </div>

      {/* Add Holiday Form */}
      {showForm && (
        <form
          onSubmit={addHoliday}
          className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
        >
          <Input
            label="Holiday Date"
            type="date"
            required
            value={form.date}
            onChange={(event) => {
              handleChange("date", event.target.value);
            }}
          />

          <Input
            label="Holiday Name"
            required
            placeholder="e.g. Diwali"
            value={form.name}
            onChange={(event) => {
              handleChange("name", event.target.value);
            }}
          />

          <label className="flex items-center gap-2 text-sm text-cm-text">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(event) => {
                handleChange("paid", event.target.checked);
              }}
              className="h-4 w-4 accent-[#000052]"
            />
            Paid Holiday
          </label>

          <div className="flex justify-end gap-3 md:col-span-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Holiday"}
            </Button>
          </div>
        </form>
      )}

      {/* Search */}
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search holiday name or date…"
      />

      {/* Holiday Table */}
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
