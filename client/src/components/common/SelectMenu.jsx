import { AlertCircle } from 'lucide-react';

const SelectMenu = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  touched,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  ...props
}) => {
  const hasError = error && touched;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`input ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectMenu;

