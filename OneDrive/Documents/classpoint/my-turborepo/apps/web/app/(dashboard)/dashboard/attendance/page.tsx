/**
 * Attendance Marking Page
 * Mark daily attendance for students in a class
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Check, X, Clock, AlertCircle, Users, Download } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useClasses, useAttendanceByClass, useCreateAttendance } from '@/lib/hooks';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AttendancePage() {
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
      <Suspense fallback={<div>Loading...</div>}>
        <AttendanceContent />
      </Suspense>
    </AuthGuard>
  );
}

function AttendanceContent() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');

  const [selectedClassId, setSelectedClassId] = useState<string>(classIdParam || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, 'present' | 'absent' | 'late' | 'excused'>
  >({});

  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];
  const createAttendance = useCreateAttendance();

  // Mock students for the selected class
  const mockStudents = selectedClassId
    ? [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          studentId: 'ST001',
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          studentId: 'ST002',
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          studentId: 'ST003',
        },
        {
          id: '4',
          firstName: 'Sarah',
          lastName: 'Williams',
          studentId: 'ST004',
        },
        {
          id: '5',
          firstName: 'Tom',
          lastName: 'Brown',
          studentId: 'ST005',
        },
      ]
    : [];

  const handleMarkAttendance = (
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const newRecords: Record<string, typeof status> = {};
    mockStudents.forEach((student) => {
      newRecords[student.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const handleSubmit = () => {
    if (!selectedClassId) {
      alert('Please select a class');
      return;
    }

    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      studentId,
      classId: selectedClassId,
      date: selectedDate,
      status,
    }));

    console.log('Submitting attendance:', records);
    // createAttendance.mutate(records);
    alert(`Attendance marked for ${records.length} students`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4" />;
      case 'absent':
        return <X className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const summary = {
    present: Object.values(attendanceRecords).filter((s) => s === 'present').length,
    absent: Object.values(attendanceRecords).filter((s) => s === 'absent').length,
    late: Object.values(attendanceRecords).filter((s) => s === 'late').length,
    excused: Object.values(attendanceRecords).filter((s) => s === 'excused').length,
    unmarked: mockStudents.length - Object.keys(attendanceRecords).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground mt-2">
            Record student attendance for today's classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/attendance/history">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View History
            </Button>
          </Link>
          <Link href="/dashboard/attendance/reports">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Selection Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Date</CardTitle>
          <CardDescription>Choose the class and date for attendance marking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">
                Class <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                      {classItem.section && ` - ${classItem.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Excused</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unmarked</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.unmarked}</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Marking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription>Mark attendance for each student</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('present')}
                  >
                    Mark All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')}>
                    Mark All Absent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockStudents.map((student) => {
                  const status = attendanceRecords[student.id];
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">ID: {student.studentId}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'present')}
                          className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          variant={status === 'absent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'absent')}
                          className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                        <Button
                          variant={status === 'late' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'late')}
                          className={status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Late
                        </Button>
                        <Button
                          variant={status === 'excused' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, 'excused')}
                          className={status === 'excused' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Excused
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {Object.keys(attendanceRecords).length} of {mockStudents.length} students marked
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(attendanceRecords).length === 0}
                >
                  Save Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a class and date to begin marking attendance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
