import { AlertCircle } from 'lucide-react';

const DatePicker = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  min,
  max,
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
      <input
        type="datetime-local"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`input ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {hasError && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;

