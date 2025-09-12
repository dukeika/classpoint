// src/components/candidate/CandidateProfile.tsx
"use client";

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeUpload } from './ResumeUpload';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeKey?: string;
}

export interface CandidateProfileProps {
  profile: UserProfile;
  onProfileUpdate?: (profile: Partial<UserProfile>) => void;
  className?: string;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  profile,
  onProfileUpdate,
  className
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onProfileUpdate?.(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    });
    setIsEditing(false);
  };

  const handleResumeUploaded = (resumeKey: string) => {
    onProfileUpdate?.({ resumeKey });
  };

  const handleResumeDeleted = () => {
    onProfileUpdate?.({ resumeKey: '' });
  };

  return (
    <div className={className}>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-2 py-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.firstName || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-2 py-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.lastName || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2 py-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profile.email}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Cannot be changed
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className="flex items-center space-x-2 py-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resume Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
            <ResumeUpload
              candidateId={profile.id}
              currentResumeKey={profile.resumeKey}
              onResumeUploaded={handleResumeUploaded}
              onResumeDeleted={handleResumeDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;