
import React from 'react';

interface DropdownProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, onChange, options, placeholder }) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={label} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={label}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-700 text-white px-4 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
