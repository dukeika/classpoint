"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, User, Building2, Mail, Lock, Phone, Globe, MapPin } from 'lucide-react';

interface UserRegistrationFormProps {
  userType: 'company' | 'candidate';
  onSuccess?: () => void;
}

export default function UserRegistrationForm({ userType, onSuccess }: UserRegistrationFormProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Company specific fields
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    companyPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters long');
      return false;
    }

    // Password strength validation
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSymbol = /[!@#$%^&*(),.?\":{}|<>]/.test(formData.password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setError('Password must contain uppercase, lowercase, numbers, and symbols');
      return false;
    }

    if (userType === 'company' && !formData.companyName) {
      setError('Company name is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const attributes = {
        given_name: formData.firstName,
        family_name: formData.lastName,
        phone_number: formData.phone,
        'custom:user_type': userType,
      };

      // Add company-specific attributes
      if (userType === 'company') {
        Object.assign(attributes, {
          'custom:company_name': formData.companyName,
          'custom:company_website': formData.companyWebsite,
          'custom:company_address': formData.companyAddress,
          'custom:company_phone': formData.companyPhone,
        });
      }

      await signUp(formData.email, formData.password, attributes);
      setStep('verify');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Handle verification logic here
      console.log('Verification code:', verificationCode);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <Mail className="mx-auto h-12 w-12 text-abhh-teal-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to <strong>{formData.email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
              Verification Code *
            </label>
            <input
              type="text"
              name="verificationCode"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-center text-lg font-mono text-gray-900"
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-abhh-teal-600 text-white py-2 px-4 rounded-md hover:bg-abhh-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={() => setStep('register')}
            className="w-full text-abhh-teal-600 hover:text-abhh-teal-700 transition-colors"
          >
            ← Back to Registration
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        {userType === 'company' ? (
          <Building2 className="mx-auto h-12 w-12 text-abhh-teal-600 mb-4" />
        ) : (
          <User className="mx-auto h-12 w-12 text-abhh-teal-600 mb-4" />
        )}
        <h2 className="text-2xl font-bold text-gray-900">
          {userType === 'company' ? 'Company Registration' : 'Candidate Registration'}
        </h2>
        <p className="text-gray-600 mt-2">
          Create your {userType === 'company' ? 'company' : 'candidate'} account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1 relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Company-specific fields */}
        {userType === 'company' && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <div className="mt-1 relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                Company Website
              </label>
              <div className="mt-1 relative">
                <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  name="companyWebsite"
                  id="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
                  placeholder="https://www.company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                Company Address
              </label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="companyAddress"
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
                />
              </div>
            </div>
          </>
        )}

        {/* Password fields */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Password must be 12+ characters with uppercase, lowercase, numbers, and symbols
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 text-gray-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-abhh-teal-600 text-white py-2 px-4 rounded-md hover:bg-abhh-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Account...' : `Create ${userType === 'company' ? 'Company' : 'Candidate'} Account`}
        </button>
      </form>
    </div>
  );
}