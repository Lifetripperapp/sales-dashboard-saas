import React, { useState, useRef, useEffect } from 'react';

/**
 * MultiSelect component for selecting multiple items from a dropdown
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of options to select from
 * @param {Array} props.value - Array of selected option values
 * @param {Function} props.onChange - Function called when selection changes
 * @param {string} props.placeholder - Placeholder text when no items are selected
 * @param {string} props.label - Label for the input
 * @param {string} props.labelKey - Key in options object to use for label display
 * @param {string} props.valueKey - Key in options object to use for value
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} The MultiSelect component
 */
const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select items...',
  label,
  labelKey = 'label',
  valueKey = 'value',
  disabled = false,
  required = false,
  error = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef(null);
  
  // Filter options based on search text
  const filteredOptions = searchText 
    ? options.filter(option => 
        option[labelKey].toLowerCase().includes(searchText.toLowerCase())
      )
    : options;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle option selection
  const handleOptionClick = (option) => {
    const optionValue = option[valueKey];
    const isSelected = value.includes(optionValue);
    
    let newValue;
    if (isSelected) {
      // Remove from selection
      newValue = value.filter(val => val !== optionValue);
    } else {
      // Add to selection
      newValue = [...value, optionValue];
    }
    
    onChange(newValue);
  };
  
  // Get display value for selected options
  const getSelectedLabels = () => {
    if (!value.length) return '';
    
    const selectedOptions = options.filter(option => 
      value.includes(option[valueKey])
    );
    
    return selectedOptions.map(option => option[labelKey]).join(', ');
  };
  
  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#4A453F] mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        ref={dropdownRef}
        className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Selected display */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex justify-between items-center w-full px-3 py-2 border 
            ${error ? 'border-red-500' : 'border-gray-200'} 
            rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 
            focus:ring-[#F58220] focus:border-transparent`}
        >
          <div className="flex-1 truncate">
            {getSelectedLabels() || <span className="text-gray-400">{placeholder}</span>}
          </div>
          <div className="flex items-center">
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 mr-2"
                aria-label="Clear selection"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Dropdown content */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="p-2 border-b">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            
            {/* Options list */}
            <ul className="py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-gray-500 text-center">No options found</li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option[valueKey]);
                  return (
                    <li
                      key={option[valueKey]}
                      onClick={() => handleOptionClick(option)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                        isSelected ? 'bg-gray-50 font-medium' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 text-[#F58220] focus:ring-[#F58220] border-gray-300 rounded"
                      />
                      <span className="ml-2">{option[labelKey]}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default MultiSelect; 