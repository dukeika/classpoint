/**
 * Settings Page
 * Main settings hub with navigation to different setting categories
 */

'use client';

import Link from 'next/link';
import { Building2, User, Bell, Shield, Palette, Database } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth, useIsAdmin } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your personal information and account preferences',
      icon: User,
      href: '/dashboard/settings/profile',
      available: true,
    },
    {
      id: 'school',
      title: 'School Settings',
      description: 'Configure school information, branding, and general settings',
      icon: Building2,
      href: '/dashboard/settings/school',
      available: isAdmin,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage notification preferences and alerts',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      available: true,
      comingSoon: true,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Security settings, password, and two-factor authentication',
      icon: Shield,
      href: '/dashboard/settings/security',
      available: true,
      comingSoon: true,
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
      icon: Palette,
      href: '/dashboard/settings/appearance',
      available: true,
      comingSoon: true,
    },
    {
      id: 'data',
      title: 'Data & Backup',
      description: 'Export data, backups, and data retention settings',
      icon: Database,
      href: '/dashboard/settings/data',
      available: isAdmin,
      comingSoon: true,
    },
  ];

  const availableSections = settingsSections.filter((section) => section.available);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Logged in as</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: <span className="font-medium">{user?.role}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-3">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.comingSoon ? (
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : (
                  <Link href={section.href}>
                    <Button variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/dashboard/settings/profile">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/dashboard/settings/school">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  School Settings
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
