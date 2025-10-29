import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentService } from './assignment.service';
import { PrismaService } from '@classpoint/db';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

// Define AssignmentStatus enum for testing
enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

describe('AssignmentService', () => {
  let service: AssignmentService;
  let prisma: PrismaService;

  const mockPrismaService = {
    assignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new assignment', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const createAssignmentDto = {
        classId: 'class-123',
        subjectId: 'subject-123',
        title: 'Math Assignment 1',
        description: 'Complete exercises 1-10',
        instructions: 'Show all work',
        dueDate: '2024-04-01',
        maxScore: 100,
        status: AssignmentStatus.DRAFT,
      };

      const mockClass = { id: 'class-123', tenantId };
      const mockSubject = { id: 'subject-123', tenantId };
      const mockAssignment = {
        id: 'assignment-123',
        tenantId,
        ...createAssignmentDto,
        createdBy: userId,
        _count: { submissions: 0 },
      };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.subject.findUnique.mockResolvedValue(mockSubject);
      mockPrismaService.assignment.create.mockResolvedValue(mockAssignment);

      const result = await service.create(
        tenantId,
        userId,
        createAssignmentDto
      );

      expect(result).toEqual(mockAssignment);
      expect(mockPrismaService.assignment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if class does not exist', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const createAssignmentDto = {
        classId: 'non-existent',
        subjectId: 'subject-123',
        title: 'Test',
        description: 'Test',
        maxScore: 100,
      };

      mockPrismaService.class.findUnique.mockResolvedValue(null);
      mockPrismaService.subject.findUnique.mockResolvedValue({});

      await expect(
        service.create(tenantId, userId, createAssignmentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const createAssignmentDto = {
        classId: 'class-123',
        subjectId: 'non-existent',
        title: 'Test',
        description: 'Test',
        maxScore: 100,
      };

      mockPrismaService.class.findUnique.mockResolvedValue({});
      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      await expect(
        service.create(tenantId, userId, createAssignmentDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated assignments', async () => {
      const tenantId = 'tenant-123';
      const mockAssignments = [
        {
          id: 'assignment-1',
          tenantId,
          title: 'Assignment 1',
          status: AssignmentStatus.PUBLISHED,
          _count: { submissions: 5 },
        },
      ];

      mockPrismaService.assignment.findMany.mockResolvedValue(mockAssignments);
      mockPrismaService.assignment.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { skip: 0, take: 10 });

      expect(result.data).toEqual(mockAssignments);
      expect(result.total).toBe(1);
    });

    it('should filter by classId', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.count.mockResolvedValue(0);

      await service.findAll(tenantId, { classId });

      expect(mockPrismaService.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ classId }),
        })
      );
    });

    it('should filter by status', async () => {
      const tenantId = 'tenant-123';
      const status = AssignmentStatus.PUBLISHED;

      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.count.mockResolvedValue(0);

      await service.findAll(tenantId, { status });

      expect(mockPrismaService.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return an assignment by id', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const mockAssignment = {
        id: assignmentId,
        tenantId,
        title: 'Test Assignment',
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockAssignment);

      const result = await service.findOne(tenantId, assignmentId);

      expect(result).toEqual(mockAssignment);
    });

    it('should throw NotFoundException if assignment does not exist', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'non-existent';

      mockPrismaService.assignment.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tenantId, assignmentId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update an assignment', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';
      const updateDto = {
        title: 'Updated Assignment',
      };

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        title: 'Old Title',
        submissions: [],
        _count: { submissions: 0 },
      };

      const mockUpdated = {
        ...mockExisting,
        title: 'Updated Assignment',
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.assignment.update.mockResolvedValue(mockUpdated);

      const result = await service.update(
        tenantId,
        assignmentId,
        userId,
        updateDto
      );

      expect(result.title).toBe('Updated Assignment');
    });

    it('should throw ForbiddenException if user is not creator', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';
      const otherUserId = 'other-user';
      const updateDto = { title: 'Updated' };

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: otherUserId,
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);

      await expect(
        service.update(tenantId, assignmentId, userId, updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publish', () => {
    it('should publish a draft assignment', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        status: AssignmentStatus.DRAFT,
        submissions: [],
        _count: { submissions: 0 },
      };

      const mockPublished = {
        ...mockExisting,
        status: AssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.assignment.update.mockResolvedValue(mockPublished);

      const result = await service.publish(tenantId, assignmentId, userId);

      expect(result.status).toBe(AssignmentStatus.PUBLISHED);
    });

    it('should throw BadRequestException if already published', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        status: AssignmentStatus.PUBLISHED,
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);

      await expect(
        service.publish(tenantId, assignmentId, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not creator', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: 'other-user',
        status: AssignmentStatus.DRAFT,
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);

      await expect(
        service.publish(tenantId, assignmentId, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('close', () => {
    it('should close an assignment', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockExisting = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        status: AssignmentStatus.PUBLISHED,
        submissions: [],
        _count: { submissions: 0 },
      };

      const mockClosed = {
        ...mockExisting,
        status: AssignmentStatus.CLOSED,
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.assignment.update.mockResolvedValue(mockClosed);

      const result = await service.close(tenantId, assignmentId, userId);

      expect(result.status).toBe(AssignmentStatus.CLOSED);
    });
  });

  describe('remove', () => {
    it('should delete a draft assignment', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockAssignment = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        status: AssignmentStatus.DRAFT,
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockAssignment);
      mockPrismaService.submission.count.mockResolvedValue(0);
      mockPrismaService.assignment.delete.mockResolvedValue(mockAssignment);

      await service.remove(tenantId, assignmentId, userId);

      expect(mockPrismaService.assignment.delete).toHaveBeenCalledWith({
        where: { id: assignmentId },
      });
    });

    it('should throw BadRequestException when deleting published assignment with submissions', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockAssignment = {
        id: assignmentId,
        tenantId,
        createdBy: userId,
        status: AssignmentStatus.PUBLISHED,
        submissions: [],
        _count: { submissions: 5 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockAssignment);
      mockPrismaService.submission.count.mockResolvedValue(5);

      await expect(
        service.remove(tenantId, assignmentId, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not creator', async () => {
      const tenantId = 'tenant-123';
      const assignmentId = 'assignment-123';
      const userId = 'user-123';

      const mockAssignment = {
        id: assignmentId,
        tenantId,
        createdBy: 'other-user',
        submissions: [],
        _count: { submissions: 0 },
      };

      mockPrismaService.assignment.findFirst.mockResolvedValue(mockAssignment);

      await expect(
        service.remove(tenantId, assignmentId, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submit', () => {
    it('should create a new submission', async () => {
      const studentId = 'student-123';
      const createSubmissionDto = {
        assignmentId: 'assignment-123',
        content: 'My submission content',
        attachments: ['file1.pdf'],
      };

      const mockAssignment = {
        id: 'assignment-123',
        status: AssignmentStatus.PUBLISHED,
      };

      const mockSubmission = {
        id: 'submission-123',
        assignmentId: createSubmissionDto.assignmentId,
        studentId,
        content: createSubmissionDto.content,
        attachments: createSubmissionDto.attachments,
      };

      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.submission.findUnique.mockResolvedValue(null);
      mockPrismaService.submission.create.mockResolvedValue(mockSubmission);

      const result = await service.submit(studentId, createSubmissionDto);

      expect(result).toEqual(mockSubmission);
    });

    it('should update existing submission', async () => {
      const studentId = 'student-123';
      const createSubmissionDto = {
        assignmentId: 'assignment-123',
        content: 'Updated submission',
        attachments: [],
      };

      const mockAssignment = {
        id: 'assignment-123',
        status: AssignmentStatus.PUBLISHED,
      };

      const mockExisting = {
        id: 'submission-123',
        assignmentId: createSubmissionDto.assignmentId,
        studentId,
      };

      const mockUpdated = {
        ...mockExisting,
        content: createSubmissionDto.content,
        submittedAt: new Date(),
      };

      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.submission.findUnique.mockResolvedValue(mockExisting);
      mockPrismaService.submission.update.mockResolvedValue(mockUpdated);

      const result = await service.submit(studentId, createSubmissionDto);

      expect(result.content).toBe('Updated submission');
    });

    it('should throw BadRequestException if assignment not published', async () => {
      const studentId = 'student-123';
      const createSubmissionDto = {
        assignmentId: 'assignment-123',
        content: 'Content',
      };

      const mockAssignment = {
        id: 'assignment-123',
        status: AssignmentStatus.DRAFT,
      };

      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);

      await expect(
        service.submit(studentId, createSubmissionDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('gradeSubmission', () => {
    it('should grade a submission', async () => {
      const submissionId = 'submission-123';
      const userId = 'teacher-123';
      const gradeDto = {
        score: 85,
        feedback: 'Good work!',
      };

      const mockSubmission = {
        id: submissionId,
        assignment: {
          maxScore: 100,
        },
      };

      const mockGraded = {
        ...mockSubmission,
        score: gradeDto.score,
        feedback: gradeDto.feedback,
        gradedAt: new Date(),
        gradedBy: userId,
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.update.mockResolvedValue(mockGraded);

      const result = await service.gradeSubmission(
        submissionId,
        userId,
        gradeDto
      );

      expect(result.score).toBe(85);
      expect(result.feedback).toBe('Good work!');
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      const submissionId = 'non-existent';
      const userId = 'teacher-123';
      const gradeDto = { score: 85, feedback: 'Good' };

      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.gradeSubmission(submissionId, userId, gradeDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if score exceeds max score', async () => {
      const submissionId = 'submission-123';
      const userId = 'teacher-123';
      const gradeDto = {
        score: 150,
        feedback: 'Excellent',
      };

      const mockSubmission = {
        id: submissionId,
        assignment: {
          maxScore: 100,
        },
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.gradeSubmission(submissionId, userId, gradeDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissions', () => {
    it('should return all submissions for an assignment', async () => {
      const assignmentId = 'assignment-123';
      const mockSubmissions = [
        {
          id: 'submission-1',
          assignmentId,
          studentId: 'student-1',
          content: 'Submission 1',
        },
        {
          id: 'submission-2',
          assignmentId,
          studentId: 'student-2',
          content: 'Submission 2',
        },
      ];

      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissions);

      const result = await service.getSubmissions(assignmentId);

      expect(result).toEqual(mockSubmissions);
      expect(result.length).toBe(2);
    });
  });

  describe('getStudentSubmissions', () => {
    it('should return all submissions for a student', async () => {
      const studentId = 'student-123';
      const mockSubmissions = [
        {
          id: 'submission-1',
          studentId,
          assignmentId: 'assignment-1',
          content: 'Submission 1',
        },
        {
          id: 'submission-2',
          studentId,
          assignmentId: 'assignment-2',
          content: 'Submission 2',
        },
      ];

      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissions);

      const result = await service.getStudentSubmissions(studentId);

      expect(result).toEqual(mockSubmissions);
      expect(result.length).toBe(2);
    });
  });
});
