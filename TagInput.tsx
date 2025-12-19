
import React, { useState, useEffect } from 'react';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  label: string;
  colorClass?: string;
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ 
  tags, onAdd, onRemove, placeholder, label, colorClass = "bg-blue-100 text-blue-800",
  inputValue: externalValue, onInputChange
}) => {
  const [internalValue, setInternalValue] = useState('');
  
  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = onInputChange || setInternalValue;

  const handleAdd = (val: string) => {
    const trimmed = val.trim().replace(/,$/, '');
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      handleAdd(val);
    } else {
      setValue(val);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        {tags.map((tag, index) => (
          <span key={index} className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${colorClass}`}>
            {tag}
            <button 
              onClick={() => onRemove(index)}
              className="hover:text-red-600 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => handleAdd(value)}
          placeholder={tags.length === 0 ? placeholder : "Добавьте еще..."}
          className="flex-grow min-w-[120px] outline-none text-sm p-1"
        />
      </div>
    </div>
  );
};

export default TagInput;
