// src/app/company/setup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { companyService } from "@/services/companyService";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Building, 
  CheckCircle,
  AlertCircle,
  ArrowRight 
} from "lucide-react";

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function CompanyAdminSetupPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'profile' | 'password' | 'complete'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userRole !== 'company_admin') {
      router.push('/login');
      return;
    }

    const initializeSetup = async () => {
      try {
        // Get current user info
        if (user?.userId) {
          const userRecord = await userService.getUserBySub(user.userId);
          setUserInfo(userRecord);
          
          if (userRecord) {
            setFormData(prev => ({
              ...prev,
              firstName: userRecord.firstName || '',
              lastName: userRecord.lastName || '',
              phone: userRecord.phone || ''
            }));

            // Get company info if user is assigned to a company
            if (userRecord.companyId) {
              const company = await companyService.getCompanyById(userRecord.companyId);
              setCompanyInfo(company);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing setup:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSetup();
  }, [user, userRole, router]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateProfileStep = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordStep = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileNext = async () => {
    if (!validateProfileStep()) return;

    setSaving(true);
    try {
      // Update user profile
      if (userInfo?.id) {
        await userService.updateUser({
          id: userInfo.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });
      }
      setStep('password');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordNext = async () => {
    if (!validatePasswordStep()) return;

    setSaving(true);
    try {
      // Change password using Amplify
      const amplifyAuth = await import('aws-amplify/auth');
      await amplifyAuth.updatePassword({
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setStep('complete');
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.name === 'NotAuthorizedException') {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else if (error.name === 'InvalidPasswordException') {
        setErrors({ newPassword: 'Password does not meet requirements' });
      } else {
        alert('Failed to change password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    router.push('/company/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h1>
          <p className="text-gray-600 mb-6">
            Your profile has been updated and your password has been changed. 
            You&apos;re now ready to manage your company&apos;s hiring process.
          </p>
          {companyInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Your Company</span>
              </div>
              <p className="text-blue-800 font-medium">{companyInfo.name}</p>
              <p className="text-blue-600 text-sm">{companyInfo.email}</p>
            </div>
          )}
          <Button onClick={handleComplete} className="w-full">
            Go to Dashboard
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to ABHH!</h1>
          <p className="text-blue-100">
            Complete your profile setup to start managing your company&apos;s hiring process
          </p>
          {companyInfo && (
            <div className="mt-4 p-3 bg-blue-700 rounded-lg">
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-semibold">{companyInfo.name}</div>
                  <div className="text-sm text-blue-100">{companyInfo.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'profile' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                step === 'password' ? 'bg-blue-600' : step === 'profile' ? 'bg-gray-300' : 'bg-green-600'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'profile' ? 'bg-gray-300 text-gray-500' : 
                step === 'password' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                2
              </div>
            </div>
          </div>

          {step === 'profile' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Update Your Profile</h2>
                <p className="text-gray-600">Please update your profile information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={userInfo?.email || ''}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>

              <Button onClick={handleProfileNext} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Next: Change Password'}
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Your Password</h2>
                <p className="text-gray-600">Please change your temporary password</p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-2" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Security Requirement</p>
                    <p>You must change your temporary password before proceeding.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Password must contain uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setStep('profile')} 
                  variant="outline" 
                  className="flex-1"
                  disabled={saving}
                >
                  Back
                </Button>
                <Button onClick={handlePasswordNext} disabled={saving} className="flex-1">
                  {saving ? 'Changing Password...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}