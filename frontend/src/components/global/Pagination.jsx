/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

const Pagination = ({ totalItems, itemsPerPage, onPageChange, currentPage: controlledCurrentPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    content: { common },
  } = useTranslationContext();

  const activePage = controlledCurrentPage || currentPage;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageClick = (page) => {
    setCurrentPage(page);
    onPageChange(page);
  };

  const handleNext = () => {
    if (activePage < totalPages) {
      handlePageClick(activePage + 1);
    }
  };

  const handlePrev = () => {
    if (activePage > 1) {
      handlePageClick(activePage - 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-[rgba(40,18,11,.3)] py-3 px-4 rounded-md md:mb-0 -mb-16">
      <button
        onClick={handlePrev}
        disabled={activePage === 1}
        className={`text-white text-sm md:text-lg cursor-pointer ${
          activePage === 1 ? 'opacity-50 cursor-not-allowed' : 'underline'
        }`}
      >
        {common.previous}
      </button>

      {/* Page Numbers */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`text-white text-sm md:text-lg ${
                activePage === page ? 'font-bold' : ''
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={activePage === totalPages}
        className={`text-white text-sm md:text-lg cursor-pointer ${
          activePage === totalPages
            ? 'opacity-50 cursor-not-allowed'
            : 'underline'
        }`}
      >
        {common.next}
      </button>
    </div>
  );
};

export default Pagination;
