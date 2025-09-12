// src/lib/storage.ts
// File upload utilities using AWS S3

import { uploadData, downloadData, remove, list } from 'aws-amplify/storage';

export interface FileUploadResult {
  key: string;
  url: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class StorageService {
  
  // Upload a file to S3
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      const key = `${path}/${Date.now()}-${file.name}`;
      
      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
          onProgress: onProgress ? (event) => {
            // Handle the transfer progress event structure
            const loaded = (event as any).loaded ?? 0;
            const total = (event as any).total ?? 0;
            if (total > 0) {
              onProgress({
                loaded,
                total,
                percentage: Math.round((loaded / total) * 100)
              });
            }
          } : undefined
        }
      });

      // Wait for the upload to complete
      await result.result;
      
      return {
        key,
        url: await this.getFileUrl(key),
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get a signed URL for a file
  static async getFileUrl(key: string): Promise<string> {
    try {
      const result = await downloadData({ key });
      const blob = await (result as any).body;
      return URL.createObjectURL(blob as Blob);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  // Delete a file from S3
  static async deleteFile(key: string): Promise<void> {
    try {
      await remove({ key });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // List files in a path
  static async listFiles(path: string): Promise<string[]> {
    try {
      const result = await list({ 
        prefix: path,
        options: {
          pageSize: 100
        }
      });
      return result.items.map(item => item.key);
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Upload resume specifically
  static async uploadResume(
    file: File,
    candidateId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF or Word document.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File too large. Please upload a file smaller than 5MB.');
    }

    return this.uploadFile(file, `resumes/${candidateId}`, onProgress);
  }

  // Upload company logo
  static async uploadCompanyLogo(
    file: File,
    companyId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File too large. Please upload an image smaller than 2MB.');
    }

    return this.uploadFile(file, `company-logos/${companyId}`, onProgress);
  }

  // Upload video test recording
  static async uploadVideoRecording(
    blob: Blob,
    candidateId: string,
    questionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    // Create a file from the blob
    const file = new File([blob], `${questionId}-${Date.now()}.webm`, {
      type: 'video/webm'
    });

    return this.uploadFile(file, `video-recordings/${candidateId}`, onProgress);
  }
}