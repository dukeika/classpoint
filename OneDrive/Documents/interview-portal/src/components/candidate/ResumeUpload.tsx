// src/components/candidate/ResumeUpload.tsx
"use client";

import React, { useState } from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { StorageService, FileUploadResult } from '@/lib/storage';
import { Button } from '@/components/ui/button';

export interface ResumeUploadProps {
  candidateId: string;
  currentResumeKey?: string;
  onResumeUploaded?: (resumeKey: string) => void;
  onResumeDeleted?: () => void;
  className?: string;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  candidateId,
  currentResumeKey,
  onResumeUploaded,
  onResumeDeleted,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentResume, setCurrentResume] = useState<{
    key: string;
    url: string;
    name: string;
  } | null>(null);

  // Load current resume info if we have a key
  React.useEffect(() => {
    if (currentResumeKey) {
      loadCurrentResume(currentResumeKey);
    }
  }, [currentResumeKey]);

  const loadCurrentResume = async (resumeKey: string) => {
    try {
      const url = await StorageService.getFileUrl(resumeKey);
      const fileName = resumeKey.split('/').pop() || 'resume.pdf';
      setCurrentResume({
        key: resumeKey,
        url,
        name: fileName
      });
    } catch (error) {
      console.error('Error loading current resume:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await StorageService.uploadResume(
        file,
        candidateId,
        (progress) => {
          // Progress is handled by the FileUpload component
        }
      );

      // If there was a previous resume, delete it
      if (currentResumeKey) {
        try {
          await StorageService.deleteFile(currentResumeKey);
        } catch (error) {
          console.warn('Could not delete old resume:', error);
        }
      }

      setCurrentResume({
        key: result.key,
        url: result.url,
        name: file.name
      });

      onResumeUploaded?.(result.key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentResume) return;

    try {
      await StorageService.deleteFile(currentResume.key);
      setCurrentResume(null);
      onResumeDeleted?.();
    } catch (error) {
      console.error('Error deleting resume:', error);
      setUploadError('Failed to delete resume');
    }
  };

  const handleDownload = () => {
    if (currentResume?.url) {
      const link = document.createElement('a');
      link.href = currentResume.url;
      link.download = currentResume.name;
      link.click();
    }
  };

  if (currentResume) {
    return (
      <div className={className}>
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Current Resume</h3>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{currentResume.name}</p>
                <p className="text-sm text-green-700">Resume uploaded successfully</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <Download className="w-4 h-4" />
              </Button>
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
          </div>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentResume(null)}
              disabled={isUploading}
            >
              Upload New Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Resume</h3>
        
        <FileUpload
          accept=".pdf,.doc,.docx"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={(file, uploadFn) => handleUpload(file)}
          onUploadError={(error) => setUploadError(error.message)}
          disabled={isUploading}
        >
          <div>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload your resume
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX
              <span className="block mt-1">
                Maximum file size: 5MB
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

export default ResumeUpload;