/**
 * Create Household Page
 * Form to create a new household
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateHousehold } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const createHouseholdSchema = z.object({
  name: z.string().min(2, 'Household name must be at least 2 characters'),
  primaryContact: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type CreateHouseholdFormData = z.infer<typeof createHouseholdSchema>;

export default function CreateHouseholdPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <CreateHouseholdContent />
    </AuthGuard>
  );
}

function CreateHouseholdContent() {
  const router = useRouter();
  const createHousehold = useCreateHousehold();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateHouseholdFormData>({
    resolver: zodResolver(createHouseholdSchema),
  });

  const onSubmit = async (data: CreateHouseholdFormData) => {
    try {
      setErrorMessage('');
      // Remove empty string email
      const payload = {
        ...data,
        email: data.email || undefined,
      };
      await createHousehold.mutateAsync(payload);
      router.push('/dashboard/households');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create household');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/households" className="hover:text-foreground">
          Households
        </Link>
        <span>/</span>
        <span className="text-foreground">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/households">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Household</h1>
          <p className="text-muted-foreground mt-2">Add a new family household</p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the household details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Household Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Household Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., The Smith Family"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A descriptive name for the household
              </p>
            </div>

            {/* Primary Contact */}
            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary Contact</Label>
              <Input
                id="primaryContact"
                {...register('primaryContact')}
                placeholder="e.g., John Smith"
              />
              {errors.primaryContact && (
                <p className="text-sm text-destructive">{errors.primaryContact.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The main contact person for this household
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Optional contact details for the household</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="household@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Enter the household address..."
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The physical address of the household
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information Notice */}
        <Alert>
          <AlertDescription>
            After creating the household, you can add students and parents to it from their respective detail pages.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 mr-2" />
                Create Household
              </>
            )}
          </Button>
          <Link href="/dashboard/households">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
