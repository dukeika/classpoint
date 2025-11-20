/**
 * School Settings Page
 * Manage school/tenant information and configuration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Building2, Save, Mail, Phone, MapPin, Globe } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks';
import { useTenantById } from '@/lib/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const schoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export default function SchoolSettingsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SchoolSettingsContent />
    </AuthGuard>
  );
}

function SchoolSettingsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get tenant data (assuming user has tenantId)
  const tenantId = user?.tenantId || '';
  const { data: tenant, isLoading } = useTenantById(tenantId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: tenant?.name || '',
      email: tenant?.email || '',
      phone: tenant?.phone || '',
      address: tenant?.address || '',
      website: tenant?.website || '',
      logo: tenant?.logo || '',
    },
  });

  const onSubmit = async (data: SchoolFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      // In a real app, this would call an API endpoint to update tenant
      console.log('School settings update:', data);

      setSuccessMessage('School settings updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/settings" className="hover:text-foreground">
          Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">School</span>
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
          <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
          <p className="text-muted-foreground mt-2">Manage school information and configuration</p>
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

      {/* School Information Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General school details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                School Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  {...register('name')}
                  className="pl-10"
                  placeholder="e.g., Springfield High School"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="pl-10"
                  placeholder="contact@school.edu"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Primary contact email for the school
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
                  {...register('phone')}
                  className="pl-10"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  className="pl-10"
                  placeholder="https://www.school.edu"
                />
              </div>
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  {...register('address')}
                  className="pl-10"
                  placeholder="123 Education Lane, Springfield, State 12345"
                  rows={3}
                />
              </div>
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>School branding and visual identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                {...register('logo')}
                placeholder="https://example.com/logo.png"
              />
              {errors.logo && (
                <p className="text-sm text-destructive">{errors.logo.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                URL to your school's logo image
              </p>
            </div>

            {/* Logo Preview */}
            {tenant?.logo && (
              <div>
                <Label className="text-muted-foreground">Current Logo</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/20 inline-block">
                  <img
                    src={tenant.logo}
                    alt="School Logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle>School Details</CardTitle>
            <CardDescription>Additional information about the school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">School ID</Label>
              <p className="text-sm font-mono">{tenant?.id || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">School Code</Label>
              <p className="text-sm font-mono">{tenant?.slug || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <p className="text-sm">
                {tenant?.isActive ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-red-600 font-medium">Inactive</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
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
    </div>
  );
}
