import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TablePagination = ({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(currentPage * pageSize, total);

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Result information */}
      <p className="text-sm text-[#7890AE]">
        Showing{" "}
        <span className="font-semibold text-[#16345C]">{startItem}</span> to{" "}
        <span className="font-semibold text-[#16345C]">{endItem}</span> of{" "}
        <span className="font-semibold text-[#16345C]">{total}</span> results
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={currentPage === 1}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[#D9E2EF]
            bg-white
            text-[#16345C]
            transition
            hover:bg-[#F4F7FB]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </button>

        <div
          className="
            flex
            h-9
            min-w-9
            items-center
            justify-center
            rounded-lg
            bg-[#000052]
            px-3
            text-sm
            font-semibold
            text-white
          "
        >
          {currentPage}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[#D9E2EF]
            bg-white
            text-[#16345C]
            transition
            hover:bg-[#F4F7FB]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
