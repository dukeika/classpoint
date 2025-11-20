/**
 * Analytics Page
 * Comprehensive analytics and data visualization for school metrics
 */

'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useStudents, useTeachers, useClasses, useEnrollments } from '@/lib/hooks';
import { LineChart, BarChart, StatCard } from '@/components/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AnalyticsPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <AnalyticsContent />
    </AuthGuard>
  );
}

function AnalyticsContent() {
  const [timePeriod, setTimePeriod] = useState<string>('6months');

  const { data: studentsData, isLoading: isLoadingStudents } = useStudents();
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers();
  const { data: classesData, isLoading: isLoadingClasses } = useClasses();
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useEnrollments();

  const isLoading =
    isLoadingStudents || isLoadingTeachers || isLoadingClasses || isLoadingEnrollments;

  // Mock data for various analytics
  const enrollmentGrowthData = [
    { month: 'Jan', students: 145, target: 150 },
    { month: 'Feb', students: 152, target: 160 },
    { month: 'Mar', students: 149, target: 165 },
    { month: 'Apr', students: 163, target: 170 },
    { month: 'May', students: 158, target: 175 },
    { month: 'Jun', students: 170, target: 180 },
  ];

  const gradeDistributionData = [
    { grade: 'Grade 1', students: 45 },
    { grade: 'Grade 2', students: 38 },
    { grade: 'Grade 3', students: 42 },
    { grade: 'Grade 4', students: 35 },
    { grade: 'Grade 5', students: 40 },
    { grade: 'Grade 6', students: 33 },
  ];

  const performanceData = [
    { subject: 'Math', average: 75, passing: 85 },
    { subject: 'Science', average: 82, passing: 78 },
    { subject: 'English', average: 78, passing: 80 },
    { subject: 'History', average: 70, passing: 75 },
    { subject: 'Geography', average: 73, passing: 72 },
  ];

  const attendanceRateData = [
    { week: 'Week 1', attendance: 94, target: 95 },
    { week: 'Week 2', attendance: 92, target: 95 },
    { week: 'Week 3', attendance: 96, target: 95 },
    { week: 'Week 4', attendance: 93, target: 95 },
    { week: 'Week 5', attendance: 95, target: 95 },
    { week: 'Week 6', attendance: 97, target: 95 },
  ];

  const teacherWorkloadData = [
    { teacher: 'Mr. Smith', classes: 5, students: 125 },
    { teacher: 'Mrs. Johnson', classes: 4, students: 98 },
    { teacher: 'Dr. Williams', classes: 6, students: 142 },
    { teacher: 'Ms. Brown', classes: 3, students: 78 },
    { teacher: 'Mr. Davis', classes: 5, students: 115 },
  ];

  const feeCollectionData = [
    { month: 'Jan', collected: 45000, expected: 50000 },
    { month: 'Feb', collected: 48000, expected: 50000 },
    { month: 'Mar', collected: 52000, expected: 50000 },
    { month: 'Apr', collected: 47000, expected: 50000 },
    { month: 'May', collected: 51000, expected: 50000 },
    { month: 'Jun', collected: 53000, expected: 50000 },
  ];

  const handleExport = (type: 'pdf' | 'excel') => {
    console.log(`Exporting analytics as ${type}`);
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights and data visualization
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
            <StatCard
              title="Student Growth"
              value="+12.5%"
              description="vs last period"
              icon={TrendingUp}
              iconClassName="text-green-600"
              trend={{
                value: 12.5,
                label: 'from last period',
                isPositive: true,
              }}
            />
            <StatCard
              title="Average Attendance"
              value="94.8%"
              description="This month"
              icon={Users}
              iconClassName="text-blue-600"
              trend={{
                value: 2.3,
                label: 'from last month',
                isPositive: true,
              }}
            />
            <StatCard
              title="Class Average"
              value="76.5%"
              description="Overall performance"
              icon={GraduationCap}
              iconClassName="text-purple-600"
              trend={{
                value: 1.2,
                label: 'from last term',
                isPositive: false,
              }}
            />
            <StatCard
              title="Fee Collection"
              value="$296K"
              description="Of $300K expected"
              icon={DollarSign}
              iconClassName="text-green-600"
              trend={{
                value: 98.7,
                label: 'collection rate',
                isPositive: true,
              }}
            />
          </>
        )}
      </div>

      {/* Tabs for Different Analytics Categories */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Enrollment Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Growth</CardTitle>
                <CardDescription>Student count vs target over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChart
                    data={enrollmentGrowthData}
                    xKey="month"
                    lines={[
                      { key: 'students', name: 'Actual', color: '#0ea5e9' },
                      { key: 'target', name: 'Target', color: '#94a3b8' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attendance Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate Trend</CardTitle>
                <CardDescription>Weekly attendance vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChart
                    data={attendanceRateData}
                    xKey="week"
                    lines={[
                      { key: 'attendance', name: 'Attendance %', color: '#10b981' },
                      { key: 'target', name: 'Target %', color: '#94a3b8' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Students by grade level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart
                    data={gradeDistributionData}
                    xKey="grade"
                    bars={[
                      { key: 'students', name: 'Students', color: '#0ea5e9' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Student Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Student Demographics</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gender Distribution</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">52%</p>
                      <p className="text-xs text-muted-foreground">Male</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-2xl font-bold text-pink-600">48%</p>
                      <p className="text-xs text-muted-foreground">Female</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Age Groups</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">5-7 years</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">8-10 years</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">11-13 years</span>
                      <span className="text-sm font-medium">37%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores vs passing threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart
                    data={performanceData}
                    xKey="subject"
                    bars={[
                      { key: 'average', name: 'Class Average', color: '#0ea5e9' },
                      { key: 'passing', name: 'Passing Grade', color: '#10b981' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Teacher Workload */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Workload</CardTitle>
                <CardDescription>Classes and students per teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart
                    data={teacherWorkloadData}
                    xKey="teacher"
                    bars={[
                      { key: 'classes', name: 'Classes', color: '#8b5cf6' },
                      { key: 'students', name: 'Students', color: '#0ea5e9' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fee Collection */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection</CardTitle>
                <CardDescription>Monthly collection vs expected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart
                    data={feeCollectionData}
                    xKey="month"
                    bars={[
                      { key: 'collected', name: 'Collected', color: '#10b981' },
                      { key: 'expected', name: 'Expected', color: '#94a3b8' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Current period overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">$296,000</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">$300,000</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold text-yellow-600">$4,000</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Collection Rate</span>
                    <span className="font-bold text-green-600">98.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Enrollment Trending Above Target</p>
                <p className="text-sm text-muted-foreground">
                  Current enrollment is 5.6% above target. Consider increasing capacity for next term.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <PieChart className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">History Performance Below Average</p>
                <p className="text-sm text-muted-foreground">
                  History subject performance is 6.7% below school average. Recommend additional resources.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Attendance Rate Excellent</p>
                <p className="text-sm text-muted-foreground">
                  Attendance rate is consistently above 95%. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
