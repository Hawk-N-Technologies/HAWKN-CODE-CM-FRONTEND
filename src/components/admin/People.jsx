import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import DataTable from "../tables/DataTable";
import TableSearch from "../tables/TableSearch";
import Badge from "../common/Badge";
import Avatar from "../common/Avatar";
import Button from "../common/Button";

function People() {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const getPeople = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await axios.get("/api/employees/getPeople", {
        params: {
          search,
          page,
          limit,
        },
        withCredentials: true,
      });

      // Adjust these paths to match your actual API response.
      const data = res.data?.data;

      setPeople(Array.isArray(data) ? data : []);

      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Get people error:", error);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    getPeople();
  }, [getPeople]);

  // Table columns
  const columns = [
    {
      key: "id",
      header: "ID",
      render: (row) => row.employeeId ?? row.id,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => {
        const name =
          [row.firstName, row.lastName].filter(Boolean).join(" ") ||
          row.name ||
          "Unnamed User";

        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <div>
              <p className="font-medium text-cm-text">{name}</p>
              <p className="text-xs text-cm-text-muted">{row.email || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <span className="capitalize">{row.role || "—"}</span>,
    },
    {
      key: "companyEmail",
      header: "Company Email",
      render: (row) => row.companyEmail || "—",
    },
    {
      key: "phone1",
      header: "Phone",
      render: (row) => row.phone1 || "—",
    },
    {
      key: "employmentStatus",
      header: "Employment Status",
      render: (row) => {
        const status = row.employmentStatus || "—";

        const tone =
          status === "Active"
            ? "success"
            : status === "Exited"
              ? "danger"
              : "neutral";

        return <Badge tone={tone}>{status}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            console.log("Selected person:", row);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-cm-text">People</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Manage company users and employees.
        </p>
      </header>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-cm-text-muted">
          {pagination.total} total people
        </p>

        <TableSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name or email..."
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={people}
        isLoading={isLoading}
        emptyMessage={
          search ? "No people match your search." : "No people found."
        }
      />

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-cm-text-muted">
            Page {page} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((previous) => previous - 1)}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((previous) => previous + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default People;
