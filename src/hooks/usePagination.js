import { useState } from "react";

/**
 * Client-side paging for any list already in memory (10 per page by default).
 * Goes back to page 1 whenever the list length changes (new search / filter).
 *
 *   const pager = usePagination(filteredRows);
 *   pager.pageItems.map(...)
 *   <TablePagination page={pager.page} pageSize={pager.pageSize}
 *                    total={pager.total} onPageChange={pager.setPage} />
 */
export default function usePagination(items, pageSize = 10) {
  const list = Array.isArray(items) ? items : [];

  const [page, setPage] = useState(1);
  const [lastCount, setLastCount] = useState(list.length);

  // Adjust during render (React-recommended) instead of an effect → no flicker
  if (list.length !== lastCount) {
    setLastCount(list.length);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    page: safePage,
    setPage,
    pageSize,
    total: list.length,
    totalPages,
    pageItems,
    // Only worth showing the pager when there's more than one page
    hasPages: list.length > pageSize,
  };
}
