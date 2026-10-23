import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Table2,
  MoreHorizontal,
} from "lucide-react";
import Loader from "../common/Loader";
import EmptyState from "../common/EmptyState";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

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
  const pageNumbers = getPageNumbers(page, totalPages);

  const startItem = rows.length === 0 ? 0 : (page - 1) * limit + 1;

  const endItem = Math.min((page - 1) * limit + rows.length, total);

  const goToPage = (nextPage) => {
    if (
      typeof onPageChange !== "function" ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page ||
      isLoading
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

  const navButtonClass = [
    "inline-flex h-9 items-center justify-center gap-1.5",
    "rounded-lg border border-slate-200 bg-white px-3",
    "text-xs font-semibold text-cm-navy-950",
    "transition-all duration-200",
    "hover:border-cm-navy-950 hover:bg-cm-navy-950 hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    "disabled:border-slate-200 disabled:bg-slate-50",
    "disabled:text-slate-300 disabled:shadow-none",
  ].join(" ");

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.05)]">
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
                    "text-[10px] font-bold uppercase tracking-[0.14em]",
                    "text-white/85 first:pl-7 last:pr-7",
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
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                      <Table2 size={25} strokeWidth={1.6} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-cm-navy-950">
                        Nothing to display
                      </p>
                      <p className="text-sm text-slate-500">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={[
                    "group transition-colors duration-200",
                    rowIndex % 2 === 1 ? "bg-slate-50/40" : "bg-white",
                    "hover:bg-blue-50/60 focus-within:bg-blue-50/60",
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

      {/* Pagination */}
      {hasPagination && (
        <footer className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
          {/* Results summary */}
          <p className="text-[13px] text-slate-500">
            Showing{" "}
            <span className="font-semibold tabular-nums text-cm-navy-950">
              {startItem}–{endItem}
            </span>{" "}
            of{" "}
            <span className="font-semibold tabular-nums text-cm-navy-950">
              {total.toLocaleString()}
            </span>{" "}
            records
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
            {/* Page size */}
            {typeof onPageSizeChange === "function" && (
              <label className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                  Rows per page
                </span>

                <select
                  aria-label="Rows per page"
                  value={limit}
                  onChange={changePageSize}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-cm-navy-950 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
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

            {/* Page navigation */}
            <nav
              aria-label="Table pagination"
              className="flex items-center gap-1"
            >
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
                className={navButtonClass}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((pageNumber, index) => {
                  if (pageNumber === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        aria-hidden="true"
                        className="flex h-9 w-6 items-center justify-center text-slate-400"
                      >
                        <MoreHorizontal size={17} />
                      </span>
                    );
                  }

                  const isCurrent = pageNumber === page;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-label={`Page ${pageNumber}`}
                      aria-current={isCurrent ? "page" : undefined}
                      disabled={isLoading || isCurrent}
                      onClick={() => goToPage(pageNumber)}
                      className={[
                        "inline-flex h-9 min-w-9 items-center justify-center",
                        "rounded-lg border px-2.5 text-xs font-semibold",
                        "tabular-nums transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                        isCurrent
                          ? "border-cm-navy-950 bg-cm-navy-950 text-white shadow-sm"
                          : [
                              "border-transparent bg-transparent text-slate-600",
                              "hover:border-slate-200 hover:bg-white",
                              "hover:text-cm-navy-950",
                              "disabled:cursor-default",
                            ].join(" "),
                      ].join(" ")}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(page + 1)}
                className={navButtonClass}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </footer>
      )}
    </section>
  );
};

export default DataTable;
