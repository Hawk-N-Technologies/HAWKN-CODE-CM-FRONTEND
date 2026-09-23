import React from "react";

const DataTable = ({
  columns = [],
  rows = [],
  emptyMessage = "No data found.",
}) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E0E8F2] bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-[#E0E8F2] bg-[#F8FAFC]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#7890AE]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEF2F6]">
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  className="transition-colors hover:bg-[#F8FAFC]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-5 py-4 text-sm font-medium text-[#16345C]"
                    >
                      {column.render
                        ? column.render(row)
                        : (row[column.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm text-[#7890AE]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
