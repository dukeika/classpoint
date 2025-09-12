// src/components/auth/RegistrationForm.tsx
"use client";

import React, { useState } from 'react';
import { User, Mail, Phone, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { userService } from '@/services/userService';
import { UserRole, ApprovalStatus } from '@/API';

export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegistrationFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onError,
  className
}) => {
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<RegistrationData>>({});

  const formatPhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return '';
    
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits, it's likely US/Canada
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If it has 10 digits, assume US/Canada and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it has more than 10 digits, assume it includes country code
    if (digits.length > 10) {
      return `+${digits}`;
    }
    
    // If less than 10 digits, return as is with + (user might still be typing)
    return digits.length > 0 ? `+${digits}` : '';
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Phone validation (optional but format check if provided)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Format phone number for Cognito (E.164 format)
      const formattedPhone = formData.phone ? formatPhoneNumber(formData.phone) : undefined;
      console.log('📞 Phone formatting:', formData.phone, '->', formattedPhone);

      // Step 1: Create Cognito user
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
            ...(formattedPhone && { phone_number: formattedPhone })
          }
        }
      });

      // Move to confirmation step
      setStep('confirm');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationCode.trim()) {
      onError?.('Please enter the confirmation code');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Confirm Cognito user
      const result = await confirmSignUp({
        username: formData.email,
        confirmationCode: confirmationCode.trim()
      });

      console.log('✅ Email confirmed successfully:', result);

      // The user record will be created automatically when they first log in
      // through the AuthContext ensureUserRecord function
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Confirmation error:', error);
      
      // Handle specific error cases
      if (error.name === 'NotAuthorizedException' && error.message.includes('Current status is CONFIRMED')) {
        console.log('✅ User already confirmed, proceeding to success');
        onSuccess?.();
        return;
      }
      
      if (error.name === 'CodeMismatchException') {
        onError?.('Invalid confirmation code. Please check the code and try again.');
        return;
      }
      
      if (error.name === 'ExpiredCodeException') {
        onError?.('Confirmation code has expired. Please request a new one.');
        return;
      }
      
      const errorMessage = error.message || 'Confirmation failed. Please try again.';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      await resendSignUpCode({
        username: formData.email
      });
      
      console.log('✅ Confirmation code resent successfully');
      // Show success message briefly - could be improved with a toast notification
      alert('Confirmation code resent! Check your email.');
    } catch (error: any) {
      console.error('Resend code error:', error);
      onError?.('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderRegistrationForm = () => (
    <form onSubmit={handleRegister} className="space-y-6">
      {/* Candidate Registration Header */}
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto mb-3 text-blue-500" />
        <h3 className="text-lg font-medium text-gray-900">Join as a Candidate</h3>
        <p className="text-sm text-gray-600">Create your account to search and apply for jobs</p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
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

      {/* Password Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
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
              required
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
      </div>


      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );

  const renderConfirmationForm = () => (
    <form onSubmit={handleConfirm} className="space-y-6">
      <div className="text-center">
        <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Check Your Email
        </h3>
        <p className="text-gray-600 mb-4">
          We've sent a confirmation code to <strong>{formData.email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmation Code
        </label>
        <input
          type="text"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono bg-white text-gray-900 placeholder-gray-500"
          required
          maxLength={6}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Confirming...' : 'Confirm Account'}
      </Button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending}
          className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400"
        >
          {isResending ? 'Resending...' : 'Resend confirmation code'}
        </button>
        
        <div>
          <button
            type="button"
            onClick={() => setStep('register')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className={className}>
      <div className="bg-white">
        {step === 'register' ? renderRegistrationForm() : renderConfirmationForm()}
      </div>
    </div>
  );
};

export default RegistrationForm;