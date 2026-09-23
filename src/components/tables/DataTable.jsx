import Loader from "../common/Loader";
import EmptyState from "../common/EmptyState";

/**
 * Generic enterprise data table: header, rows, loading state, empty
 * state. Search/pagination are separate components (TableSearch,
 * TablePagination) composed by the page — this component only renders
 * whatever `rows` it's given.
 *
 * columns: Array<{ key, header, render?: (row) => ReactNode }>
 * rows:    Array<object> — each needs a stable `id`.
 */
function DataTable({ columns, rows, isLoading = false, emptyMessage = "No records found." }) {
  if (isLoading) {
    return (
      <div className="rounded-cm-lg border border-cm-border bg-cm-card">
        <Loader context="section" label="Loading records…" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-cm-lg border border-cm-border bg-cm-card">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-cm-lg border border-cm-border bg-cm-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cm-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-cm-text-muted"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-cm-border last:border-0 hover:bg-cm-bg">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 text-cm-text">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;