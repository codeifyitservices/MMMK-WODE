import { useEffect, useRef, useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';

const HeaderDropdown = ({
  label,
  options = [],
  value,
  onChange,
  theme = 'dark',
  className = '',
}) => {
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
  const isLight = theme === 'light';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 text-sm outline-none transition-colors ${
          isLight
            ? 'w-full px-3 py-2 text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md font-medium'
            : 'bg-transparent tracking-widest text-white'
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="truncate">{activeOption?.label || label}</span>
        <IoChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-md shadow-xl border ${
            isLight
              ? 'left-0 right-0 min-w-[140px] bg-white border-neutral-200 text-neutral-800'
              : 'right-0 top-full min-w-[140px] border-white/15 bg-black/95 text-white'
          }`}
        >
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
                className={`block w-full px-4 py-2.5 text-left text-xs transition-colors ${
                  isLight
                    ? isActive
                      ? 'bg-neutral-200 font-semibold text-black'
                      : 'hover:bg-neutral-100 text-neutral-800'
                    : `tracking-[0.22em] text-white ${
                        isActive ? 'bg-white/15' : 'hover:bg-white/10'
                      }`
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
