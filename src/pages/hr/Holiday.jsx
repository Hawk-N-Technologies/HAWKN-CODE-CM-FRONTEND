import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";
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
        setHolidays(res.data.data || res.data.holidays || []);
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

  // Load holidays when page opens
  useEffect(() => {
    getAllHolidays();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================
  function handleChange(field, value) {
    setForm(function (previous) {
      return {
        ...previous,
        [field]: value,
      };
    });
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

        // Refresh from backend
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
  async function deleteHoliday(uuid) {
    try {
      const res = await axios.delete(`/api/company/holidays/${uuid}`, {
        withCredentials: true,
      });

      if (res.status === 200) {
        showToast.success("Holiday removed successfully.");

        setHolidays(function (previous) {
          return previous.filter(function (holiday) {
            return holiday.uuid !== uuid;
          });
        });
      }
    } catch (error) {
      console.error("Failed to delete holiday:", error);

      showToast.error(
        error.response?.data?.message || "Failed to remove holiday.",
      );
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

    return holidays.filter(function (holiday) {
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
      render: function (row) {
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
      render: function (row) {
        return <p className="font-medium text-cm-text">{row.name}</p>;
      },
    },

    {
      key: "isPaid",
      header: "Type",
      render: function (row) {
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
      render: function (row) {
        return (
          <Button
            size="sm"
            variant="danger"
            onClick={function () {
              deleteHoliday(row.uuid);
            }}
          >
            Delete
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
          onClick={function () {
            setShowForm(function (value) {
              return !value;
            });
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
            onChange={function (event) {
              handleChange("date", event.target.value);
            }}
          />

          <Input
            label="Holiday Name"
            required
            placeholder="e.g. Diwali"
            value={form.name}
            onChange={function (event) {
              handleChange("name", event.target.value);
            }}
          />

          <label className="flex items-center gap-2 text-sm text-cm-text">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={function (event) {
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
              onClick={function () {
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
          <DataTable
            columns={columns}
            rows={filteredHolidays}
            loading={loading}
            emptyMessage={
              loading ? "Loading holidays..." : "No holidays found."
            }
          />
        </div>
      </section>
    </div>
  );
}

export default Holiday;
