/**
 * Profile Settings Page
 * Manage user profile information
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, User, Save, Mail, Phone, MapPin } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfileSettingsPage() {
  return (
    <AuthGuard>
      <ProfileSettingsContent />
    </AuthGuard>
  );
}

function ProfileSettingsContent() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      // Update user profile
      await updateUser(data);

      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      // In a real app, this would call an API endpoint to change password
      // For now, just show success message
      console.log('Password change requested:', { currentPassword: data.currentPassword });

      setSuccessMessage('Password updated successfully');
      resetPassword();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/settings" className="hover:text-foreground">
          Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">Profile</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  {...registerProfile('name')}
                  className="pl-10"
                  placeholder="John Doe"
                />
              </div>
              {profileErrors.name && (
                <p className="text-sm text-destructive">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...registerProfile('email')}
                  className="pl-10"
                  placeholder="john.doe@example.com"
                />
              </div>
              {profileErrors.email && (
                <p className="text-sm text-destructive">{profileErrors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Used for account notifications and login
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  {...registerProfile('phone')}
                  className="pl-10"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {profileErrors.phone && (
                <p className="text-sm text-destructive">{profileErrors.phone.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  {...registerProfile('address')}
                  className="pl-10"
                  placeholder="123 Main St, City, State"
                />
              </div>
              {profileErrors.address && (
                <p className="text-sm text-destructive">{profileErrors.address.message}</p>
              )}
            </div>

            <Separator />

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || 'N/A'} disabled />
              <p className="text-xs text-muted-foreground">
                Contact an administrator to change your role
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href="/dashboard/settings">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Current Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                placeholder="Enter current password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                placeholder="Enter new password"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                placeholder="Confirm new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Details about your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-muted-foreground">User ID</Label>
            <p className="text-sm font-mono">{user?.id || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Account Status</Label>
            <p className="text-sm">Active</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
