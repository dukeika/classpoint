import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentService } from './enrollment.service';
import { PrismaService } from '@classpoint/db';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let prisma: PrismaService;

  const mockPrismaService = {
    enrollment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    term: {
      findFirst: jest.fn(),
    },
    class: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new enrollment', async () => {
      const tenantId = 'tenant-123';
      const createEnrollmentDto = {
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
      };

      const mockStudent = {
        id: 'student-123',
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockTerm = {
        id: 'term-123',
        tenantId,
        name: 'First Term',
      };

      const mockClass = {
        id: 'class-123',
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
      };

      const mockEnrollment = {
        id: 'enrollment-123',
        tenantId,
        ...createEnrollmentDto,
        isPromoted: false,
        promotedAt: null,
        promotedBy: null,
        student: mockStudent,
        term: mockTerm,
        class: mockClass,
      };

      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.count.mockResolvedValue(15);
      mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);

      const result = await service.create(tenantId, createEnrollmentDto);

      expect(result).toEqual(mockEnrollment);
      expect(mockPrismaService.enrollment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if student does not exist', async () => {
      const tenantId = 'tenant-123';
      const createEnrollmentDto = {
        studentId: 'non-existent',
        termId: 'term-123',
        classId: 'class-123',
      };

      mockPrismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.create(tenantId, createEnrollmentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if student already enrolled for term', async () => {
      const tenantId = 'tenant-123';
      const createEnrollmentDto = {
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
      };

      const mockStudent = { id: 'student-123', tenantId };
      const mockTerm = { id: 'term-123', tenantId };
      const mockClass = { id: 'class-123', tenantId, capacity: 30 };

      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'existing-enrollment',
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
      });

      await expect(
        service.create(tenantId, createEnrollmentDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if class is at capacity', async () => {
      const tenantId = 'tenant-123';
      const createEnrollmentDto = {
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
      };

      const mockStudent = { id: 'student-123', tenantId };
      const mockTerm = { id: 'term-123', tenantId };
      const mockClass = {
        id: 'class-123',
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
      };

      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.count.mockResolvedValue(30);

      await expect(
        service.create(tenantId, createEnrollmentDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkEnroll', () => {
    it('should enroll multiple students', async () => {
      const tenantId = 'tenant-123';
      const bulkEnrollDto = {
        termId: 'term-123',
        enrollments: [
          { studentId: 'student-1', classId: 'class-123' },
          { studentId: 'student-2', classId: 'class-123' },
        ],
      };

      const mockTerm = { id: 'term-123', tenantId };
      const mockStudent = { id: 'student-1', tenantId };
      const mockClass = { id: 'class-123', tenantId, capacity: 30 };
      const mockEnrollment = {
        id: 'enrollment-1',
        tenantId,
        studentId: 'student-1',
        termId: 'term-123',
        classId: 'class-123',
      };

      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.count.mockResolvedValue(10);
      mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);

      const result = await service.bulkEnroll(tenantId, bulkEnrollDto);

      expect(result.successful.length).toBeGreaterThan(0);
    });

    it('should handle partial failures in bulk enrollment', async () => {
      const tenantId = 'tenant-123';
      const bulkEnrollDto = {
        termId: 'term-123',
        enrollments: [
          { studentId: 'student-1', classId: 'class-123' },
          { studentId: 'non-existent', classId: 'class-123' },
        ],
      };

      const mockTerm = { id: 'term-123', tenantId };

      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.student.findFirst
        .mockResolvedValueOnce({ id: 'student-1', tenantId })
        .mockResolvedValueOnce(null);

      const result = await service.bulkEnroll(tenantId, bulkEnrollDto);

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0]).toHaveProperty('error');
    });
  });

  describe('findAll', () => {
    it('should return paginated enrollments', async () => {
      const tenantId = 'tenant-123';
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          tenantId,
          studentId: 'student-1',
          termId: 'term-123',
          classId: 'class-123',
          isPromoted: false,
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);
      mockPrismaService.enrollment.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { skip: 0, take: 10 });

      expect(result.data).toEqual(mockEnrollments);
      expect(result.total).toBe(1);
    });

    it('should filter by termId', async () => {
      const tenantId = 'tenant-123';
      const termId = 'term-123';

      mockPrismaService.enrollment.findMany.mockResolvedValue([]);
      mockPrismaService.enrollment.count.mockResolvedValue(0);

      await service.findAll(tenantId, { termId });

      expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, termId }),
        })
      );
    });

    it('should filter by classId', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      mockPrismaService.enrollment.findMany.mockResolvedValue([]);
      mockPrismaService.enrollment.count.mockResolvedValue(0);

      await service.findAll(tenantId, { classId });

      expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, classId }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return an enrollment by id', async () => {
      const tenantId = 'tenant-123';
      const enrollmentId = 'enrollment-123';
      const mockEnrollment = {
        id: enrollmentId,
        tenantId,
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
      };

      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);

      const result = await service.findOne(tenantId, enrollmentId);

      expect(result).toEqual(mockEnrollment);
    });

    it('should throw NotFoundException if enrollment does not exist', async () => {
      const tenantId = 'tenant-123';
      const enrollmentId = 'non-existent';

      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tenantId, enrollmentId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCurrentEnrollment', () => {
    it('should return current enrollment for student', async () => {
      const tenantId = 'tenant-123';
      const studentId = 'student-123';

      const mockTerm = {
        id: 'term-123',
        tenantId,
        isCurrent: true,
      };

      const mockEnrollment = {
        id: 'enrollment-123',
        studentId,
        termId: 'term-123',
        classId: 'class-123',
      };

      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockEnrollment
      );

      const result = await service.getCurrentEnrollment(tenantId, studentId);

      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if no current term', async () => {
      const tenantId = 'tenant-123';
      const studentId = 'student-123';

      mockPrismaService.term.findFirst.mockResolvedValue(null);

      const result = await service.getCurrentEnrollment(tenantId, studentId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update enrollment', async () => {
      const tenantId = 'tenant-123';
      const enrollmentId = 'enrollment-123';
      const updateDto = {
        isPromoted: true,
      };

      const mockExisting = {
        id: enrollmentId,
        tenantId,
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
        isPromoted: false,
        student: {},
        term: { session: {} },
        class: {},
      };

      const mockUpdated = {
        ...mockExisting,
        isPromoted: true,
        promotedAt: new Date(),
      };

      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.enrollment.update.mockResolvedValue(mockUpdated);

      const result = await service.update(tenantId, enrollmentId, updateDto);

      expect(result.isPromoted).toBe(true);
    });

    it('should throw BadRequestException if new class is at capacity', async () => {
      const tenantId = 'tenant-123';
      const enrollmentId = 'enrollment-123';
      const updateDto = {
        classId: 'new-class-123',
      };

      const mockExisting = {
        id: enrollmentId,
        tenantId,
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'old-class-123',
        student: {},
        term: { session: {} },
        class: {},
      };

      const mockNewClass = {
        id: 'new-class-123',
        tenantId,
        level: 'Grade 2',
        arm: 'A',
        capacity: 25,
      };

      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.class.findFirst.mockResolvedValue(mockNewClass);
      mockPrismaService.enrollment.count.mockResolvedValue(25);

      await expect(
        service.update(tenantId, enrollmentId, updateDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an enrollment', async () => {
      const tenantId = 'tenant-123';
      const enrollmentId = 'enrollment-123';

      const mockEnrollment = {
        id: enrollmentId,
        tenantId,
        studentId: 'student-123',
        termId: 'term-123',
        classId: 'class-123',
        student: {},
        term: { session: {} },
        class: {},
      };

      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.delete.mockResolvedValue(mockEnrollment);

      await service.remove(tenantId, enrollmentId);

      expect(mockPrismaService.enrollment.delete).toHaveBeenCalledWith({
        where: { id: enrollmentId },
      });
    });
  });

  describe('getClassRoster', () => {
    it('should return class roster with students', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';
      const termId = 'term-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
      };

      const mockTerm = {
        id: termId,
        tenantId,
        name: 'First Term',
      };

      const mockEnrollments = [
        {
          id: 'enrollment-1',
          classId,
          termId,
          tenantId,
          student: {
            id: 'student-1',
            firstName: 'John',
            lastName: 'Doe',
            household: {
              id: 'household-1',
              primaryContact: 'parent@example.com',
            },
          },
        },
      ];

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.term.findFirst.mockResolvedValue(mockTerm);
      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.getClassRoster(tenantId, classId, termId);

      expect(result.class).toEqual(mockClass);
      expect(result.term).toEqual(mockTerm);
      expect(result.students).toEqual(mockEnrollments);
      expect(result.count).toBe(1);
      expect(result.availableSlots).toBe(29);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      const tenantId = 'tenant-123';
      const classId = 'non-existent';
      const termId = 'term-123';

      mockPrismaService.class.findFirst.mockResolvedValue(null);
      mockPrismaService.term.findFirst.mockResolvedValue({ id: termId });

      await expect(
        service.getClassRoster(tenantId, classId, termId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudentHistory', () => {
    it('should return student enrollment history', async () => {
      const tenantId = 'tenant-123';
      const studentId = 'student-123';

      const mockStudent = {
        id: studentId,
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockEnrollments = [
        {
          id: 'enrollment-1',
          studentId,
          termId: 'term-1',
          classId: 'class-1',
          isPromoted: true,
          term: { session: {} },
          class: {},
        },
        {
          id: 'enrollment-2',
          studentId,
          termId: 'term-2',
          classId: 'class-2',
          isPromoted: false,
          term: { session: {} },
          class: {},
        },
      ];

      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.getStudentHistory(tenantId, studentId);

      expect(result.student).toEqual(mockStudent);
      expect(result.enrollments).toEqual(mockEnrollments);
      expect(result.totalEnrollments).toBe(2);
      expect(result.promotedCount).toBe(1);
    });

    it('should throw NotFoundException if student does not exist', async () => {
      const tenantId = 'tenant-123';
      const studentId = 'non-existent';

      mockPrismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.getStudentHistory(tenantId, studentId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkPromote', () => {
    it('should promote multiple students', async () => {
      const tenantId = 'tenant-123';
      const enrollmentIds = ['enrollment-1', 'enrollment-2'];
      const promotedBy = 'user-123';

      mockPrismaService.enrollment.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkPromote(
        tenantId,
        enrollmentIds,
        promotedBy
      );

      expect(result.count).toBe(2);
      expect(result.promotedBy).toBe(promotedBy);
      expect(mockPrismaService.enrollment.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: enrollmentIds },
          tenantId,
        },
        data: {
          isPromoted: true,
          promotedBy,
          promotedAt: expect.any(Date),
        },
      });
    });
  });
});
