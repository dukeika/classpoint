# ClassPoint API Documentation

Complete API reference for the ClassPoint School Management System.

**Base URL**: `http://localhost:3000` (Development)
**API Version**: v1
**Authentication**: JWT Bearer Token

## Table of Contents

1. [Authentication](#authentication)
2. [Tenant Management](#tenant-management)
3. [Plan Management](#plan-management)
4. [Academic Structure](#academic-structure)
5. [Enrollment](#enrollment)
6. [Fee Status](#fee-status)
7. [Attendance](#attendance)
8. [Assessment & Grading](#assessment--grading)
9. [Comments](#comments)
10. [External Reports](#external-reports)
11. [Announcements](#announcements)

---

## Authentication

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123!",
  "userType": "staff",
  "tenantId": "tenant-123",
  "role": "TEACHER",
  "firstName": "John",
  "lastName": "Doe"
}
```

**User Types**: `staff`, `household`, `student`
**Roles**: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123!",
  "userType": "staff"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "teacher@school.com",
    "role": "TEACHER"
  }
}
```

### Additional Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Initiate password reset |
| POST | `/auth/confirm-forgot-password` | Complete password reset |
| POST | `/auth/change-password` | Change user password |
| POST | `/auth/logout` | Logout user |

---

## Tenant Management

All endpoints require authentication with `SUPER_ADMIN` or `SCHOOL_ADMIN` role.

### Create Tenant
```http
POST /tenants
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Greenfield Academy",
  "subdomain": "greenfield",
  "contactEmail": "admin@greenfield.edu",
  "contactPhone": "+234-800-123-4567",
  "address": "123 Education Lane, Lagos",
  "planId": "plan-123",
  "isActive": true
}
```

### Get All Tenants
```http
GET /tenants?isActive=true&page=1&limit=10
Authorization: Bearer <token>
```

### Get Tenant by ID
```http
GET /tenants/:id
Authorization: Bearer <token>
```

### Update Tenant
```http
PATCH /tenants/:id
Authorization: Bearer <token>
```

### Delete Tenant
```http
DELETE /tenants/:id
Authorization: Bearer <token>
```

### Additional Tenant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/:id/stats` | Get tenant statistics |
| GET | `/tenants/:id/enrollment-info` | Get enrollment info |
| PATCH | `/tenants/:id/activate` | Activate tenant |
| PATCH | `/tenants/:id/deactivate` | Deactivate tenant |

---

## Plan Management

### Create Plan
```http
POST /plans
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Standard Plan",
  "description": "For schools with up to 500 students",
  "studentCap": 500,
  "monthlyPrice": 50000,
  "yearlyPrice": 500000,
  "features": ["Attendance", "Grading", "Reports"],
  "isActive": true
}
```

### Get All Plans
```http
GET /plans?isActive=true
Authorization: Bearer <token>
```

### Get Plan by ID
```http
GET /plans/:id
Authorization: Bearer <token>
```

### Update Plan
```http
PATCH /plans/:id
Authorization: Bearer <token>
```

### Delete Plan
```http
DELETE /plans/:id
Authorization: Bearer <token>
```

---

## Academic Structure

### Sessions

#### Create Session
```http
POST /academic/sessions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "2024/2025 Academic Session",
  "code": "2024-2025",
  "startDate": "2024-09-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "isCurrent": true
}
```

#### Get All Sessions
```http
GET /academic/sessions
Authorization: Bearer <token>
```

#### Get Current Session
```http
GET /academic/sessions/current
Authorization: Bearer <token>
```

#### Additional Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic/sessions/:id` | Get session by ID |
| GET | `/academic/sessions/:id/terms` | Get terms for a session |
| PATCH | `/academic/sessions/:id` | Update session |
| PATCH | `/academic/sessions/:id/set-current` | Set as current session |
| DELETE | `/academic/sessions/:id` | Delete session |

### Terms

#### Create Term
```http
POST /academic/terms
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sessionId": "session-123",
  "name": "First Term",
  "termNumber": 1,
  "startDate": "2024-09-01T00:00:00Z",
  "endDate": "2024-12-20T23:59:59Z",
  "isCurrent": true
}
```

#### Get All Terms
```http
GET /academic/terms?sessionId=session-123
Authorization: Bearer <token>
```

#### Get Current Term
```http
GET /academic/terms/current
Authorization: Bearer <token>
```

#### Additional Term Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic/terms/:id` | Get term by ID |
| PATCH | `/academic/terms/:id` | Update term |
| PATCH | `/academic/terms/:id/set-current` | Set as current term |
| DELETE | `/academic/terms/:id` | Delete term |

### Classes

#### Create Class
```http
POST /academic/classes
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Primary 1A",
  "code": "P1A",
  "level": "PRIMARY_1",
  "arm": "A",
  "capacity": 30,
  "formTeacherId": "teacher-123"
}
```

**Levels**: `NURSERY_1`, `NURSERY_2`, `PRIMARY_1`, `PRIMARY_2`, `PRIMARY_3`, `PRIMARY_4`, `PRIMARY_5`, `PRIMARY_6`, `JSS_1`, `JSS_2`, `JSS_3`, `SSS_1`, `SSS_2`, `SSS_3`

#### Get All Classes
```http
GET /academic/classes?level=PRIMARY_1
Authorization: Bearer <token>
```

#### Get Classes by Level
```http
GET /academic/classes/level/:level
Authorization: Bearer <token>
```

#### Get Class Capacity Info
```http
GET /academic/classes/:id/capacity
Authorization: Bearer <token>
```

**Response:**
```json
{
  "classId": "class-123",
  "className": "Primary 1A",
  "capacity": 30,
  "enrolled": 28,
  "available": 2,
  "percentageFull": 93.33
}
```

#### Additional Class Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic/classes` | Get all classes |
| GET | `/academic/classes/:id` | Get class by ID |
| GET | `/academic/classes/levels` | Get all class levels |
| PATCH | `/academic/classes/:id` | Update class |
| DELETE | `/academic/classes/:id` | Delete class |

### Departments

#### Create Department
```http
POST /academic/departments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Sciences",
  "code": "SCI",
  "hodId": "teacher-123",
  "description": "Science subjects department"
}
```

#### Get All Departments
```http
GET /academic/departments
Authorization: Bearer <token>
```

#### Get Department Subjects
```http
GET /academic/departments/:id/subjects
Authorization: Bearer <token>
```

#### Additional Department Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic/departments/:id` | Get department by ID |
| PATCH | `/academic/departments/:id` | Update department |
| DELETE | `/academic/departments/:id` | Delete department |

### Subjects

#### Create Subject
```http
POST /academic/subjects
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH",
  "departmentId": "dept-123",
  "description": "Core mathematics subject"
}
```

#### Get All Subjects
```http
GET /academic/subjects?departmentId=dept-123
Authorization: Bearer <token>
```

#### Get Subject by Code
```http
GET /academic/subjects/code/:code
Authorization: Bearer <token>
```

#### Additional Subject Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/academic/subjects/:id` | Get subject by ID |
| GET | `/academic/subjects/department/:deptId` | Get subjects by department |
| PATCH | `/academic/subjects/:id` | Update subject |
| DELETE | `/academic/subjects/:id` | Delete subject |

---

## Enrollment

### Create Enrollment
```http
POST /enrollments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "classId": "class-123",
  "createdBy": "admin-123"
}
```

### Bulk Enroll Students
```http
POST /enrollments/bulk
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "termId": "term-123",
  "enrollments": [
    {
      "studentId": "student-1",
      "classId": "class-123"
    },
    {
      "studentId": "student-2",
      "classId": "class-123"
    }
  ],
  "createdBy": "admin-123"
}
```

**Response:**
```json
{
  "successful": [
    {
      "id": "enrollment-1",
      "studentId": "student-1",
      "classId": "class-123",
      ...
    }
  ],
  "failed": [
    {
      "studentId": "student-2",
      "error": "Class is at full capacity"
    }
  ]
}
```

### Bulk Promote Students
```http
POST /enrollments/promote/bulk
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fromTermId": "term-123",
  "toTermId": "term-456",
  "promotions": [
    {
      "studentId": "student-1",
      "newClassId": "class-456"
    }
  ],
  "createdBy": "admin-123"
}
```

### Get Class Roster
```http
GET /enrollments/class/:classId/roster?termId=term-123
Authorization: Bearer <token>
```

### Get Student Enrollment History
```http
GET /enrollments/student/:studentId/history
Authorization: Bearer <token>
```

### Additional Enrollment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/enrollments` | Get all enrollments (with filters) |
| GET | `/enrollments/:id` | Get enrollment by ID |
| GET | `/enrollments/student/:studentId/current` | Get current enrollment |
| PATCH | `/enrollments/:id` | Update enrollment |
| DELETE | `/enrollments/:id` | Delete enrollment |

---

## Fee Status

### Create Fee Status
```http
POST /fee-status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "status": "FULL",
  "updatedBy": "admin-123"
}
```

**Status Types**: `FULL` (fully paid), `PARTIAL` (partially paid), `NONE` (not paid)

### Bulk Update Fee Status
```http
POST /fee-status/bulk-update
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "termId": "term-123",
  "updates": [
    {
      "studentIdentifier": "2024001",  // admission number or student ID
      "status": "FULL"
    }
  ],
  "updatedBy": "admin-123"
}
```

### Get Term Fee Summary
```http
GET /fee-status/term/:termId/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "termId": "term-123",
  "total": 500,
  "byStatus": {
    "FULL": 350,
    "PARTIAL": 100,
    "NONE": 50
  },
  "percentages": {
    "FULL": 70,
    "PARTIAL": 20,
    "NONE": 10
  }
}
```

### Get Audit History
```http
GET /fee-status/:id/audit-history
Authorization: Bearer <token>
```

### Additional Fee Status Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fee-status` | Get all fee statuses (with filters) |
| GET | `/fee-status/:id` | Get fee status by ID |
| GET | `/fee-status/student/:studentId/term/:termId` | Get fee status for student in term |
| PATCH | `/fee-status/:id` | Update fee status |
| DELETE | `/fee-status/:id` | Delete fee status |

---

## Attendance

### Mark Single Attendance
```http
POST /attendance
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "classId": "class-123",
  "date": "2025-01-25T00:00:00Z",
  "session": "MORNING",
  "status": "PRESENT",
  "markedBy": "teacher-123"
}
```

**Sessions**: `MORNING`, `AFTERNOON`
**Status**: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`

### Bulk Mark Attendance
```http
POST /attendance/bulk
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "classId": "class-123",
  "date": "2025-01-25T00:00:00Z",
  "session": "MORNING",
  "records": [
    { "studentId": "student-1", "status": "PRESENT" },
    { "studentId": "student-2", "status": "ABSENT" },
    { "studentId": "student-3", "status": "LATE" }
  ],
  "markedBy": "teacher-123"
}
```

### Get Class Attendance
```http
GET /attendance/class/:classId?date=2025-01-25&session=MORNING
Authorization: Bearer <token>
```

### Get Student Attendance Summary
```http
GET /attendance/student/:studentId/summary?termId=term-123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "summary": {
    "total": 60,
    "present": 55,
    "absent": 3,
    "late": 2,
    "excused": 0
  },
  "attendanceRate": 95
}
```

### Get Attendance Report
```http
GET /attendance/report?classId=class-123&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

### Additional Attendance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance/:id` | Get attendance by ID |
| PATCH | `/attendance/:id` | Update attendance |
| DELETE | `/attendance/:id` | Delete attendance |

---

## Assessment & Grading

### Create Assessment
```http
POST /assessments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "termId": "term-123",
  "subjectId": "subject-123",
  "type": "CA1",
  "name": "First Continuous Assessment",
  "maxScore": 10,
  "weight": 10,
  "dueDate": "2025-02-15T23:59:59Z"
}
```

**Assessment Types**: `CA1`, `CA2`, `CA3`, `EXAM`, `PROJECT`, `PRACTICAL`

### Get Assessments
```http
GET /assessments?termId=term-123&subjectId=subject-123
Authorization: Bearer <token>
```

### Enter Grade
```http
POST /assessments/grades
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "assessmentId": "assessment-123",
  "studentId": "student-123",
  "subjectId": "subject-123",
  "score": 8,
  "enteredBy": "teacher-123",
  "isPublished": false
}
```

### Bulk Enter Grades
```http
POST /assessments/grades/bulk
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "assessmentId": "assessment-123",
  "subjectId": "subject-123",
  "grades": [
    { "studentIdentifier": "2024001", "score": 8 },
    { "studentIdentifier": "2024002", "score": 9 }
  ],
  "enteredBy": "teacher-123"
}
```

### Get Student Results
```http
GET /assessments/student/:studentId/results?termId=term-123&subjectId=subject-123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "student": {
    "id": "student-123",
    "firstName": "John",
    "lastName": "Doe"
  },
  "results": [
    {
      "subject": {
        "id": "subject-123",
        "name": "Mathematics",
        "code": "MATH"
      },
      "totalScore": 72.5,
      "totalWeight": 100,
      "finalScore": 72.5,
      "grades": [
        {
          "id": "grade-1",
          "assessment": {
            "type": "CA1",
            "maxScore": 10,
            "weight": 10
          },
          "score": 8,
          "percentage": 80
        },
        {
          "id": "grade-2",
          "assessment": {
            "type": "EXAM",
            "maxScore": 100,
            "weight": 70
          },
          "score": 70,
          "percentage": 70
        }
      ]
    }
  ]
}
```

### Publish/Unpublish Grades
```http
PATCH /assessments/:assessmentId/publish
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isPublished": true
}
```

---

## Comments

### Create Comment
```http
POST /comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "authorId": "teacher-123",
  "type": "teacher",
  "text": "Excellent performance this term. Shows great potential in mathematics."
}
```

**Comment Types**: `teacher`, `principal`, `housemaster`

### Bulk Create Comments
```http
POST /comments/bulk
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "termId": "term-123",
  "studentIds": ["student-1", "student-2", "student-3"],
  "authorId": "teacher-123",
  "type": "teacher",
  "text": "Good progress this term. Keep up the good work!"
}
```

### Get Comments for Student
```http
GET /comments/student/:studentId?termId=term-123
Authorization: Bearer <token>
```

### Get Comments by Type
```http
GET /comments/student/:studentId/type/:type?termId=term-123
Authorization: Bearer <token>
```

### Get Term Comments
```http
GET /comments/term/:termId?type=teacher
Authorization: Bearer <token>
```

### Get Comment Statistics
```http
GET /comments/term/:termId/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 150,
  "byType": {
    "teacher": 100,
    "principal": 30,
    "housemaster": 20
  }
}
```

### Additional Comment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comments/:id` | Get comment by ID |
| PATCH | `/comments/:id` | Update comment (author only) |
| DELETE | `/comments/:id` | Delete comment (author or admin) |

---

## External Reports

### Generate Presigned URL
```http
POST /external-reports/presigned-url
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "fileName": "report-card.pdf",
  "mimeType": "application/pdf",
  "action": "upload",
  "fileSize": 1024000
}
```

**Actions**: `upload`, `download`
**Allowed MIME Types**: `application/pdf`, `image/png`, `image/jpeg`

**Response:**
```json
{
  "presignedUrl": "https://s3.amazonaws.com/bucket/...",
  "s3Key": "reports/tenant-123/term-123/student-123/1706198400000_report-card.pdf",
  "expiresIn": 3600
}
```

### Create Report Record
```http
POST /external-reports
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "termId": "term-123",
  "name": "First Term Report Card",
  "s3Key": "reports/tenant-123/term-123/student-123/1706198400000_report-card.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1024000,
  "uploadedBy": "teacher-123"
}
```

### Get Reports for Student
```http
GET /external-reports/student/:studentId?termId=term-123
Authorization: Bearer <token>
```

### Get Reports for Term
```http
GET /external-reports/term/:termId
Authorization: Bearer <token>
```

### Get Download URL
```http
GET /external-reports/:id/download
Authorization: Bearer <token>
```

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/...",
  "expiresIn": 3600,
  "fileName": "First Term Report Card",
  "mimeType": "application/pdf",
  "fileSize": 1024000
}
```

### Get Storage Statistics
```http
GET /external-reports/statistics?termId=term-123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 250,
  "totalSizeBytes": 256000000,
  "totalSizeMB": 244.14
}
```

### Additional External Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/external-reports/:id` | Get report by ID |
| PATCH | `/external-reports/:id` | Update report metadata |
| DELETE | `/external-reports/:id` | Delete report (S3 + DB) |

---

## Announcements

### Create Announcement
```http
POST /announcements
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "School Closure Notice",
  "content": "The school will be closed on Monday for a public holiday.",
  "audience": "SCHOOL_WIDE",
  "inApp": true,
  "email": true,
  "sms": false,
  "createdBy": "admin-123"
}
```

**Audience Types**: `SCHOOL_WIDE`, `CLASS`, `CUSTOM_GROUP`

### Get All Announcements
```http
GET /announcements?audience=SCHOOL_WIDE&published=true
Authorization: Bearer <token>
```

### Get School-Wide Announcements
```http
GET /announcements/school-wide
Authorization: Bearer <token>
```

### Get Class Announcements
```http
GET /announcements/class/:classId
Authorization: Bearer <token>
```

**Returns**: School-wide announcements + class-specific announcements

### Publish Announcement
```http
PATCH /announcements/:id/publish
Authorization: Bearer <token>
```

### Unpublish Announcement
```http
PATCH /announcements/:id/unpublish
Authorization: Bearer <token>
```

### Get Announcement Statistics
```http
GET /announcements/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 150,
  "published": 120,
  "draft": 30,
  "byAudience": {
    "SCHOOL_WIDE": 50,
    "CLASS": 90,
    "CUSTOM_GROUP": 10
  },
  "byChannel": {
    "inApp": 150,
    "email": 80,
    "sms": 20
  }
}
```

### Additional Announcement Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/announcements/:id` | Get announcement by ID |
| PATCH | `/announcements/:id` | Update announcement |
| DELETE | `/announcements/:id` | Delete announcement |

---

## Common Response Formats

### Success Response
```json
{
  "id": "resource-123",
  "name": "Resource Name",
  "createdAt": "2025-01-25T10:00:00Z",
  "updatedAt": "2025-01-25T10:00:00Z",
  ...
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### Bulk Operation Response
```json
{
  "successful": [
    { "id": "...", ... }
  ],
  "failed": [
    {
      "identifier": "...",
      "error": "Error message"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request succeeded, no content to return |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently not implemented. Will be added in production with the following limits:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

---

## Pagination

For endpoints that return lists, use query parameters:

```http
GET /resource?page=1&limit=10
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Filtering and Sorting

Most list endpoints support filtering and sorting:

```http
GET /students?gender=MALE&classId=class-123&sort=lastName:asc
```

**Common Query Parameters:**
- `sort`: Field and direction (e.g., `lastName:asc`, `createdAt:desc`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

---

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api
```

This provides:
- Complete endpoint reference
- Request/response schemas
- Try-it-out functionality
- Authentication testing

---

## Postman Collection

A Postman collection with all endpoints is available in the `/docs` directory:

[Download Postman Collection](./postman/ClassPoint-API.postman_collection.json)

---

## SDK Support (Planned)

Official SDKs will be available for:
- TypeScript/JavaScript
- Python
- PHP
- Java

---

## Support

For API support:
- **Documentation**: [https://docs.classpoint.com/api](./API.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/classpoint/issues)
- **Email**: api-support@classpoint.com
