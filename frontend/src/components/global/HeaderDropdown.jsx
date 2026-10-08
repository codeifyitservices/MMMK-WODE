import { useEffect, useRef, useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';

const HeaderDropdown = ({ label, options = [], value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const activeOption = options.find((option) => option.value === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-transparent text-sm tracking-widest text-white outline-none"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{activeOption?.label || label}</span>
        <IoChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-3 min-w-[140px] overflow-hidden rounded-md border border-white/15 bg-black/95 shadow-xl">
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-xs tracking-[0.22em] text-white transition-colors ${
                  isActive ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HeaderDropdown;
