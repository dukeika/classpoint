/**
 * Attendance History Page
 * View all attendance records with filters
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, FileText, Check, X, Clock, AlertCircle, Filter } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAttendance, useClasses } from '@/lib/hooks';
import { DataTable } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  notes?: string;
}

export default function AttendanceHistoryPage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <AttendanceHistoryContent />
    </AuthGuard>
  );
}

function AttendanceHistoryContent() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: attendanceData, isLoading } = useAttendance();
  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];

  // Mock attendance data
  const mockAttendance: AttendanceRecord[] = [
    {
      id: '1',
      studentName: 'John Doe',
      studentId: 'ST001',
      className: 'Grade 5A',
      date: '2025-01-14',
      status: 'present',
      markedBy: 'Ms. Johnson',
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      studentId: 'ST002',
      className: 'Grade 5A',
      date: '2025-01-14',
      status: 'absent',
      markedBy: 'Ms. Johnson',
      notes: 'Sick',
    },
    {
      id: '3',
      studentName: 'Mike Johnson',
      studentId: 'ST003',
      className: 'Grade 5A',
      date: '2025-01-14',
      status: 'late',
      markedBy: 'Ms. Johnson',
    },
    {
      id: '4',
      studentName: 'Sarah Williams',
      studentId: 'ST004',
      className: 'Grade 5B',
      date: '2025-01-14',
      status: 'present',
      markedBy: 'Mr. Smith',
    },
    {
      id: '5',
      studentName: 'Tom Brown',
      studentId: 'ST005',
      className: 'Grade 5B',
      date: '2025-01-13',
      status: 'excused',
      markedBy: 'Mr. Smith',
      notes: 'Doctor appointment',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      present: { variant: 'default' as const, className: 'bg-green-600', icon: Check },
      absent: { variant: 'destructive' as const, className: '', icon: X },
      late: { variant: 'default' as const, className: 'bg-yellow-600', icon: Clock },
      excused: { variant: 'default' as const, className: 'bg-blue-600', icon: AlertCircle },
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue('date'));
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div>
            <div className="font-medium">{record.studentName}</div>
            <div className="text-sm text-muted-foreground">ID: {record.studentId}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'markedBy',
      header: 'Marked By',
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string | undefined;
        return notes ? (
          <span className="text-sm">{notes}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
          <p className="text-muted-foreground mt-2">View and filter all attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/attendance">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/dashboard/attendance/reports">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter attendance records by date, class, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">From Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">To Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendance.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockAttendance.filter((r) => r.status === 'present').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockAttendance.filter((r) => r.status === 'absent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late/Excused</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockAttendance.filter((r) => r.status === 'late' || r.status === 'excused').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Complete history of all attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={mockAttendance}
              searchKey="studentName"
              searchPlaceholder="Search by student name..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
