/**
 * Create Announcement Page
 * Form to create a new announcement
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Megaphone } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useCreateAnnouncement } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  publishDate: z.string().min(1, 'Publish date is required'),
  expiryDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type CreateAnnouncementFormData = z.infer<typeof createAnnouncementSchema>;

export default function CreateAnnouncementPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <CreateAnnouncementContent />
    </AuthGuard>
  );
}

function CreateAnnouncementContent() {
  const router = useRouter();
  const createAnnouncement = useCreateAnnouncement();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnnouncementFormData>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const priority = watch('priority');

  const onSubmit = async (data: CreateAnnouncementFormData) => {
    try {
      setErrorMessage('');
      await createAnnouncement.mutateAsync(data);
      router.push('/dashboard/announcements');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/announcements" className="hover:text-foreground">
          Announcements
        </Link>
        <span>/</span>
        <span className="text-foreground">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/announcements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Announcement</h1>
          <p className="text-muted-foreground mt-2">Compose a new announcement</p>
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
            <CardTitle>Announcement Details</CardTitle>
            <CardDescription>Enter the announcement information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., School Closure Notice"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A clear, descriptive title for the announcement
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="Enter the full announcement message..."
                rows={6}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The detailed message that will be shown to recipients
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Priority</CardTitle>
            <CardDescription>Set when the announcement should be published and expire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Publish Date */}
              <div className="space-y-2">
                <Label htmlFor="publishDate">
                  Publish Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="publishDate"
                  type="datetime-local"
                  {...register('publishDate')}
                />
                {errors.publishDate && (
                  <p className="text-sm text-destructive">{errors.publishDate.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  When the announcement should be published
                </p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  {...register('expiryDate')}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional: When the announcement should no longer be displayed
                </p>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General Information</SelectItem>
                  <SelectItem value="medium">Medium - Important Notice</SelectItem>
                  <SelectItem value="high">High - Urgent/Critical</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Priority determines the visibility and emphasis of the announcement
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information Notice */}
        <Alert>
          <AlertDescription>
            The announcement will be created as a draft. You can publish it after review from the announcement detail page.
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
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </>
            )}
          </Button>
          <Link href="/dashboard/announcements">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
