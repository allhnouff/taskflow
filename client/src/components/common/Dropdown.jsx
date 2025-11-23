import { useState, useRef, useEffect } from 'react';

const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Adjust position if dropdown would overflow
      const adjustPosition = () => {
        if (menuRef.current && dropdownRef.current) {
          const menuRect = menuRef.current.getBoundingClientRect();
          const triggerRect = dropdownRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Check horizontal overflow
          if (menuRect.right > viewportWidth) {
            menuRef.current.style.right = '0';
            menuRef.current.style.left = 'auto';
          }
          if (menuRect.left < 0) {
            menuRef.current.style.left = '0';
            menuRef.current.style.right = 'auto';
          }
          
          // Check vertical overflow - adjust max-height if needed
          const spaceBelow = viewportHeight - triggerRect.bottom;
          const spaceAbove = triggerRect.top;
          if (menuRect.bottom > viewportHeight) {
            const maxHeight = Math.max(200, Math.min(spaceBelow - 20, spaceAbove - 20));
            menuRef.current.style.maxHeight = `${maxHeight}px`;
          }
        }
      };
      
      // Adjust immediately and after a small delay to ensure layout is complete
      adjustPosition();
      setTimeout(adjustPosition, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignClasses = {
    right: 'right-0',
    left: 'left-0',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 ${alignClasses[align]} overflow-hidden`}
          style={{ minWidth: 'fit-content' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;

