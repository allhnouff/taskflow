import { useState, useRef } from 'react';

const FileUpload = ({
  label,
  onFileSelect,
  accept,
  multiple = false,
  error,
  disabled = false,
}) => {
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name).join(', ');
      setFileName(fileNames);
      onFileSelect(multiple ? files : files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="btn btn-secondary"
        >
          Choose File
        </button>
        {fileName && (
          <span className="text-sm text-gray-600 truncate flex-1">{fileName}</span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;

