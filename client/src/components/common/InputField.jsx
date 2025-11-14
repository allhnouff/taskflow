import { CheckCircle2, AlertCircle } from 'lucide-react';

const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  touched,
  placeholder,
  required = false,
  disabled = false,
  showValidationIcon = false,
  ...props
}) => {
  const hasError = error && touched;
  const isValid = !error && touched && value && value.trim();
  const showIcon = showValidationIcon && touched && (hasError || isValid);

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`input pr-10 ${hasError ? 'border-red-500 focus:ring-red-500' : isValid ? 'border-green-500 focus:ring-green-500' : ''}`}
          {...props}
        />
        {showIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : isValid ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;

