/**
 * Dashboard Overview Page
 * Main dashboard with statistics, charts, and quick actions
 */

'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  Home,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Plus,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useStudents,
  useTeachers,
  useClasses,
  useEnrollments,
  useHouseholds,
} from '@/lib/hooks';
import { StatCard, LineChart, BarChart } from '@/components/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  // Fetch data using React Query hooks
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents();
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers();
  const { data: classesData, isLoading: isLoadingClasses } = useClasses();
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useEnrollments();
  const { data: householdsData, isLoading: isLoadingHouseholds } = useHouseholds();

  const isLoading =
    isLoadingStudents ||
    isLoadingTeachers ||
    isLoadingClasses ||
    isLoadingEnrollments ||
    isLoadingHouseholds;

  // Calculate statistics
  const totalStudents = studentsData?.data?.length ?? 0;
  const totalTeachers = teachersData?.data?.length ?? 0;
  const activeClasses = classesData?.data?.length ?? 0;
  const totalEnrollments = enrollmentsData?.data?.length ?? 0;
  const totalHouseholds = householdsData?.data?.length ?? 0;

  // Mock data for enrollment trend chart (last 6 months)
  const enrollmentTrendData = [
    { month: 'Jan', enrollments: 45 },
    { month: 'Feb', enrollments: 52 },
    { month: 'Mar', enrollments: 49 },
    { month: 'Apr', enrollments: 63 },
    { month: 'May', enrollments: 58 },
    { month: 'Jun', enrollments: totalEnrollments || 65 },
  ];

  // Mock data for attendance overview (last 5 days)
  const attendanceData = [
    { day: 'Mon', present: 87, absent: 5 },
    { day: 'Tue', present: 89, absent: 3 },
    { day: 'Wed', present: 85, absent: 7 },
    { day: 'Thu', present: 91, absent: 1 },
    { day: 'Fri', present: 88, absent: 4 },
  ];

  const quickActions = [
    {
      name: 'Add Student',
      description: 'Register a new student to the school',
      href: '/dashboard/students/new',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Create Class',
      description: 'Set up a new class for the term',
      href: '/dashboard/classes/new',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Mark Attendance',
      description: 'Record student attendance for today',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'View Reports',
      description: 'Generate and view school reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // Mock recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'student',
      message: 'New student enrollment: John Doe',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'attendance',
      message: 'Attendance marked for Class 5A',
      time: '3 hours ago',
    },
    {
      id: 3,
      type: 'assignment',
      message: 'New assignment posted in Mathematics',
      time: '5 hours ago',
    },
    {
      id: 4,
      type: 'announcement',
      message: 'School holiday announcement published',
      time: '1 day ago',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'Admin'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening in your school today
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Link href="/dashboard/students">
              <StatCard
                title="Total Students"
                value={totalStudents}
                description="Active students enrolled"
                icon={GraduationCap}
                iconClassName="text-blue-600"
                trend={{
                  value: 12.5,
                  label: 'from last month',
                  isPositive: true,
                }}
                className="hover:shadow-md transition-shadow cursor-pointer"
              />
            </Link>
            <Link href="/dashboard/teachers">
              <StatCard
                title="Teachers"
                value={totalTeachers}
                description="Active teaching staff"
                icon={Users}
                iconClassName="text-green-600"
                className="hover:shadow-md transition-shadow cursor-pointer"
              />
            </Link>
            <Link href="/dashboard/classes">
              <StatCard
                title="Active Classes"
                value={activeClasses}
                description="Running this term"
                icon={BookOpen}
                iconClassName="text-purple-600"
                trend={{
                  value: 8.2,
                  label: 'from last term',
                  isPositive: true,
                }}
                className="hover:shadow-md transition-shadow cursor-pointer"
              />
            </Link>
            <Link href="/dashboard/enrollments">
              <StatCard
                title="Enrollments"
                value={totalEnrollments}
                description="Total enrollments"
                icon={ClipboardList}
                iconClassName="text-orange-600"
                className="hover:shadow-md transition-shadow cursor-pointer"
              />
            </Link>
            <Link href="/dashboard/households">
              <StatCard
                title="Households"
                value={totalHouseholds}
                description="Registered families"
                icon={Home}
                iconClassName="text-pink-600"
                className="hover:shadow-md transition-shadow cursor-pointer"
              />
            </Link>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
            <CardDescription>Last 6 months enrollment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <LineChart
                data={enrollmentTrendData}
                xKey="month"
                lines={[
                  {
                    key: 'enrollments',
                    name: 'Enrollments',
                    color: '#0ea5e9',
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Last 5 days attendance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart
                data={attendanceData}
                xKey="day"
                bars={[
                  {
                    key: 'present',
                    name: 'Present',
                    color: '#10b981',
                  },
                  {
                    key: 'absent',
                    name: 'Absent',
                    color: '#ef4444',
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <CardTitle className="text-base">{action.name}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your school</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/activity">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0"
              >
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.message}
                  </p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
