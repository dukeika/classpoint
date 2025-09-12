// src/components/ui/FileUpload.tsx
"use client";

import React, { useRef, useState } from 'react';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StorageService, FileUploadResult, UploadProgress } from '@/lib/storage';

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  onUpload: (file: File, uploadFn: () => Promise<FileUploadResult>) => void;
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  children?: React.ReactNode;
}

export interface FileUploadItemProps {
  file: File;
  uploadFn: () => Promise<FileUploadResult>;
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadError?: (error: Error) => void;
  onRemove?: () => void;
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  file,
  uploadFn,
  onUploadComplete,
  onUploadError,
  onRemove
}) => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [status, setStatus] = useState<'pending' | 'uploading' | 'completed' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    try {
      setStatus('uploading');
      setError(null);
      
      const result = await uploadFn();
      
      setStatus('completed');
      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      onUploadComplete?.(result);
    } catch (err) {
      const error = err as Error;
      setStatus('error');
      setError(error.message);
      onUploadError?.(error);
    }
  };

  React.useEffect(() => {
    if (status === 'pending') {
      handleUpload();
    }
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3 flex-1">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
            {progress && status === 'uploading' && (
              <span className="ml-2">• {progress.percentage}%</span>
            )}
          </p>
          {progress && status === 'uploading' && (
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxSize,
  onUpload,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
  multiple = false,
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (maxSize && file.size > maxSize) {
        onUploadError?.(new Error(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`));
        continue;
      }
      
      // Add to uploading files
      setUploadingFiles(prev => [...prev, file]);
      
      // Call onUpload with the file and upload function
      onUpload(file, () => {
        // This will be replaced by the specific upload function
        return Promise.resolve({
          key: '',
          url: '',
          size: file.size,
          type: file.type
        });
      });
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {children || (
          <div>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              {accept && `Supported formats: ${accept.replace(/\./g, '').toUpperCase()}`}
              {maxSize && (
                <span className="block mt-1">
                  Maximum file size: {formatFileSize(maxSize)}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((file, index) => (
            <FileUploadItem
              key={`${file.name}-${index}`}
              file={file}
              uploadFn={() => {
                // This should be provided by the parent component
                return Promise.resolve({
                  key: '',
                  url: '',
                  size: file.size,
                  type: file.type
                });
              }}
              onUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
              onRemove={() => removeUploadingFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;