import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Table2,
} from "lucide-react";
import Loader from "../common/Loader";
import EmptyState from "../common/EmptyState";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DataTable = ({
  columns = [],
  rows = [],
  emptyMessage = "No records found.",
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  isLoading = false,
}) => {
  const page = Math.max(1, Number(pagination?.page ?? 1));

  const limit = Math.max(1, Number(pagination?.limit ?? 10));

  const total = Math.max(0, Number(pagination?.total ?? rows.length));

  const totalPages = Math.max(
    1,
    Number(pagination?.totalPages ?? Math.ceil(total / limit)),
  );

  const hasPagination = Boolean(pagination);

  const startItem = rows.length === 0 ? 0 : (page - 1) * limit + 1;

  const endItem = Math.min((page - 1) * limit + rows.length, total);

  const goToPage = (nextPage) => {
    if (
      typeof onPageChange !== "function" ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    onPageChange(nextPage);
  };

  const changePageSize = (event) => {
    const nextLimit = Number(event.target.value);

    if (
      Number.isFinite(nextLimit) &&
      nextLimit > 0 &&
      typeof onPageSizeChange === "function"
    ) {
      onPageSizeChange(nextLimit);
    }
  };

  const renderCell = (column, row) => {
    if (typeof column.render === "function") {
      return column.render(row);
    }

    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }

    const key = column.key ?? column.accessorKey ?? column.id;

    return key ? (row?.[key] ?? "—") : "—";
  };

  const getRowKey = (row, index) =>
    row?.id ?? row?.uuid ?? row?.userUuid ?? row?.employeeUuid ?? index;

  const buttonBaseClass = [
    "inline-flex h-9 items-center justify-center gap-1.5",
    "rounded-xl border border-slate-200 bg-white px-3",
    "text-xs font-semibold text-cm-navy-950 shadow-sm",
    "transition-all duration-200",
    "hover:border-cm-navy-950 hover:bg-cm-navy-950",
    "hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-35",
  ].join(" ");

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.05)]">
      {/* Table */}
      <div className="relative w-full overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-cm-navy-950">
              {columns.map((column, index) => (
                <th
                  key={column.key ?? column.id ?? column.header ?? index}
                  scope="col"
                  className={[
                    "whitespace-nowrap border-b border-white/10",
                    "px-6 py-[18px]",
                    "text-[10px] font-bold uppercase",
                    "tracking-[0.14em] text-white/85",
                    "first:pl-7 last:pr-7",
                    column.headerClassName ?? "",
                  ].join(" ")}
                >
                  {column.header ?? column.label ?? ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader />
                    <p className="text-sm font-medium text-slate-500">
                      Loading records...
                    </p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-6 py-16 text-center"
                >
                  {EmptyState ? (
                    <EmptyState message={emptyMessage} />
                  ) : (
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                        <Table2
                          size={25}
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-cm-navy-950">
                          Nothing to display
                        </p>
                        <p className="text-sm text-slate-500">{emptyMessage}</p>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={[
                    "group bg-white transition-colors duration-200",
                    "hover:bg-blue-50/60",
                    "focus-within:bg-blue-50/60",
                    rowIndex % 2 === 1 ? "bg-slate-50/40" : "",
                  ].join(" ")}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={
                        column.key ??
                        column.id ??
                        column.accessorKey ??
                        columnIndex
                      }
                      className={[
                        "px-6 py-[17px] align-middle",
                        "text-[13px] leading-5 text-slate-700",
                        "first:pl-7 last:pr-7",
                        "transition-colors duration-200",
                        column.cellClassName ?? "",
                      ].join(" ")}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {hasPagination && (
        <footer className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          {/* Record count */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-[13px] text-slate-500">Showing</span>

            <span className="text-[13px] font-bold tabular-nums text-cm-navy-950">
              {startItem}–{endItem}
            </span>

            <span className="text-[13px] text-slate-500">of</span>

            <span className="text-[13px] font-bold tabular-nums text-cm-navy-950">
              {total.toLocaleString()}
            </span>

            <span className="text-[13px] text-slate-500">records</span>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Page size selector */}
            {typeof onPageSizeChange === "function" && (
              <label className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                  Rows per page
                </span>

                <select
                  aria-label="Rows per page"
                  value={limit}
                  onChange={changePageSize}
                  className={[
                    "h-9 rounded-xl border border-slate-200",
                    "bg-white px-3 text-sm font-semibold",
                    "text-cm-navy-950 outline-none",
                    "transition-all hover:border-slate-300",
                    "focus:border-blue-500",
                    "focus:ring-2 focus:ring-blue-500/15",
                  ].join(" ")}
                >
                  {[...new Set([...pageSizeOptions.map(Number), limit])]
                    .filter((size) => Number.isFinite(size) && size > 0)
                    .sort((a, b) => a - b)
                    .map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <div className="flex items-center gap-1.5">
              {/* First page */}
              <button
                type="button"
                aria-label="First page"
                title="First page"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(1)}
                className={buttonBaseClass}
              >
                <ChevronsLeft size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>

              {/* Previous page */}
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
                className={buttonBaseClass}
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Current page */}
              <span
                aria-live="polite"
                className="inline-flex h-9 min-w-[76px] items-center justify-center gap-1 rounded-xl bg-cm-navy-950 px-3 text-xs font-bold tabular-nums text-white shadow-sm"
              >
                {page}
                <span className="text-white/50">/</span>
                {totalPages}
              </span>

              {/* Next page */}
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(page + 1)}
                className={buttonBaseClass}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>

              {/* Last page */}
              <button
                type="button"
                aria-label="Last page"
                title="Last page"
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(totalPages)}
                className={buttonBaseClass}
              >
                <ChevronsRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
};

export default DataTable;
