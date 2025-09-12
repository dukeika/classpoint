// src/components/company/CompanyLogoUpload.tsx
"use client";

import React, { useState } from 'react';
import { Building, Upload, Trash2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { StorageService, FileUploadResult } from '@/lib/storage';
import { Button } from '@/components/ui/button';

export interface CompanyLogoUploadProps {
  companyId: string;
  currentLogoKey?: string;
  onLogoUploaded?: (logoKey: string) => void;
  onLogoDeleted?: () => void;
  className?: string;
}

export const CompanyLogoUpload: React.FC<CompanyLogoUploadProps> = ({
  companyId,
  currentLogoKey,
  onLogoUploaded,
  onLogoDeleted,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<{
    key: string;
    url: string;
    name: string;
  } | null>(null);

  // Load current logo info if we have a key
  React.useEffect(() => {
    if (currentLogoKey) {
      loadCurrentLogo(currentLogoKey);
    }
  }, [currentLogoKey]);

  const loadCurrentLogo = async (logoKey: string) => {
    try {
      const url = await StorageService.getFileUrl(logoKey);
      const fileName = logoKey.split('/').pop() || 'logo.png';
      setCurrentLogo({
        key: logoKey,
        url,
        name: fileName
      });
    } catch (error) {
      console.error('Error loading current logo:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await StorageService.uploadCompanyLogo(
        file,
        companyId,
        (progress) => {
          // Progress is handled by the FileUpload component
        }
      );

      // If there was a previous logo, delete it
      if (currentLogoKey) {
        try {
          await StorageService.deleteFile(currentLogoKey);
        } catch (error) {
          console.warn('Could not delete old logo:', error);
        }
      }

      setCurrentLogo({
        key: result.key,
        url: result.url,
        name: file.name
      });

      onLogoUploaded?.(result.key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentLogo) return;

    try {
      await StorageService.deleteFile(currentLogo.key);
      setCurrentLogo(null);
      onLogoDeleted?.();
    } catch (error) {
      console.error('Error deleting logo:', error);
      setUploadError('Failed to delete logo');
    }
  };

  if (currentLogo) {
    return (
      <div className={className}>
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Company Logo</h3>
          
          <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <img 
              src={currentLogo.url} 
              alt="Company Logo" 
              className="w-16 h-16 object-contain rounded-lg border border-gray-200"
            />
            <div className="flex-1">
              <p className="font-medium text-green-900">{currentLogo.name}</p>
              <p className="text-sm text-green-700">Logo uploaded successfully</p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentLogo(null)}
              disabled={isUploading}
            >
              Upload New Logo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Company Logo</h3>
        
        <FileUpload
          accept=".jpg,.jpeg,.png,.gif,.webp"
          maxSize={2 * 1024 * 1024} // 2MB
          onUpload={(file, uploadFn) => handleUpload(file)}
          onUploadError={(error) => setUploadError(error.message)}
          disabled={isUploading}
        >
          <div>
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload company logo
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF, WebP
              <span className="block mt-1">
                Maximum file size: 2MB
              </span>
            </p>
          </div>
        </FileUpload>

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLogoUpload;