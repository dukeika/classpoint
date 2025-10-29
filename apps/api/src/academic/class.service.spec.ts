import { Test, TestingModule } from '@nestjs/testing';
import { ClassService } from './class.service';
import { PrismaService } from '@classpoint/db';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('ClassService', () => {
  let service: ClassService;
  let prisma: PrismaService;

  const mockPrismaService = {
    class: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
    teacherClass: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const tenantId = 'tenant-123';
      const createClassDto = {
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
      };

      const mockClass = {
        id: 'class-123',
        tenantId,
        ...createClassDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          enrollments: 0,
          teacherClasses: 0,
        },
      };

      mockPrismaService.class.findUnique.mockResolvedValue(null);
      mockPrismaService.class.create.mockResolvedValue(mockClass);

      const result = await service.create(tenantId, createClassDto);

      expect(result).toEqual(mockClass);
      expect(mockPrismaService.class.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_level_arm: {
            tenantId,
            level: createClassDto.level,
            arm: createClassDto.arm,
          },
        },
      });
      expect(mockPrismaService.class.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if class already exists', async () => {
      const tenantId = 'tenant-123';
      const createClassDto = {
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
      };

      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'existing-class',
        level: 'Grade 1',
        arm: 'A',
      });

      await expect(service.create(tenantId, createClassDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should handle class without arm', async () => {
      const tenantId = 'tenant-123';
      const createClassDto = {
        level: 'Kindergarten',
        capacity: 25,
      };

      const mockClass = {
        id: 'class-123',
        tenantId,
        level: createClassDto.level,
        arm: null,
        capacity: createClassDto.capacity,
        _count: {
          enrollments: 0,
          teacherClasses: 0,
        },
      };

      mockPrismaService.class.findUnique.mockResolvedValue(null);
      mockPrismaService.class.create.mockResolvedValue(mockClass);

      const result = await service.create(tenantId, createClassDto);

      expect(result).toEqual(mockClass);
      expect(mockPrismaService.class.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_level_arm: {
            tenantId,
            level: createClassDto.level,
            arm: null,
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list of classes', async () => {
      const tenantId = 'tenant-123';
      const mockClasses = [
        {
          id: 'class-1',
          tenantId,
          level: 'Grade 1',
          arm: 'A',
          capacity: 30,
          _count: { enrollments: 15, teacherClasses: 1, attendances: 100 },
        },
        {
          id: 'class-2',
          tenantId,
          level: 'Grade 1',
          arm: 'B',
          capacity: 30,
          _count: { enrollments: 20, teacherClasses: 1, attendances: 120 },
        },
      ];

      mockPrismaService.class.findMany.mockResolvedValue(mockClasses);
      mockPrismaService.class.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, { skip: 0, take: 10 });

      expect(result.data).toEqual(mockClasses);
      expect(result.total).toBe(2);
      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should filter by level', async () => {
      const tenantId = 'tenant-123';
      const level = 'Grade 1';
      const mockClasses = [
        {
          id: 'class-1',
          tenantId,
          level: 'Grade 1',
          arm: 'A',
          capacity: 30,
          _count: { enrollments: 15, teacherClasses: 1, attendances: 100 },
        },
      ];

      mockPrismaService.class.findMany.mockResolvedValue(mockClasses);
      mockPrismaService.class.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { level });

      expect(result.data).toEqual(mockClasses);
      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            level: { contains: level, mode: 'insensitive' },
          },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a class by id', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';
      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
          attendances: 100,
          announcements: 5,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);

      const result = await service.findOne(tenantId, classId);

      expect(result).toEqual(mockClass);
      expect(mockPrismaService.class.findFirst).toHaveBeenCalledWith({
        where: { id: classId, tenantId },
        include: {
          _count: {
            select: {
              enrollments: true,
              teacherClasses: true,
              attendances: true,
              announcements: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      const tenantId = 'tenant-123';
      const classId = 'non-existent';

      mockPrismaService.class.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tenantId, classId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findByLevel', () => {
    it('should return all classes for a specific level', async () => {
      const tenantId = 'tenant-123';
      const level = 'Grade 1';
      const mockClasses = [
        {
          id: 'class-1',
          tenantId,
          level,
          arm: 'A',
          capacity: 30,
          _count: { enrollments: 15, teacherClasses: 1 },
        },
        {
          id: 'class-2',
          tenantId,
          level,
          arm: 'B',
          capacity: 30,
          _count: { enrollments: 20, teacherClasses: 1 },
        },
      ];

      mockPrismaService.class.findMany.mockResolvedValue(mockClasses);

      const result = await service.findByLevel(tenantId, level);

      expect(result).toEqual(mockClasses);
      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith({
        where: { tenantId, level },
        include: {
          _count: {
            select: { enrollments: true, teacherClasses: true },
          },
        },
        orderBy: { arm: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update a class', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';
      const updateClassDto = {
        capacity: 35,
      };

      const mockExisting = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
          attendances: 100,
          announcements: 5,
        },
      };

      const mockUpdated = {
        ...mockExisting,
        capacity: 35,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.enrollment.count.mockResolvedValue(15);
      mockPrismaService.class.update.mockResolvedValue(mockUpdated);

      const result = await service.update(tenantId, classId, updateClassDto);

      expect(result.capacity).toBe(35);
      expect(mockPrismaService.class.update).toHaveBeenCalledWith({
        where: { id: classId },
        data: updateClassDto,
        include: {
          _count: {
            select: { enrollments: true, teacherClasses: true },
          },
        },
      });
    });

    it('should throw ConflictException when updating arm creates conflict', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';
      const updateClassDto = {
        arm: 'B',
      };

      const mockExisting = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
          attendances: 100,
          announcements: 5,
        },
      };

      const mockConflict = {
        id: 'different-class',
        tenantId,
        level: 'Grade 1',
        arm: 'B',
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.class.findUnique.mockResolvedValue(mockConflict);

      await expect(
        service.update(tenantId, classId, updateClassDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when reducing capacity below enrollment', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';
      const updateClassDto = {
        capacity: 10,
      };

      const mockExisting = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
          attendances: 100,
          announcements: 5,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockExisting);
      mockPrismaService.enrollment.count.mockResolvedValue(15);

      await expect(
        service.update(tenantId, classId, updateClassDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a class', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        _count: {
          enrollments: 0,
          teacherClasses: 0,
          attendances: 0,
          announcements: 0,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(0);
      mockPrismaService.teacherClass.count.mockResolvedValue(0);
      mockPrismaService.class.delete.mockResolvedValue(mockClass);

      await service.remove(tenantId, classId);

      expect(mockPrismaService.class.delete).toHaveBeenCalledWith({
        where: { id: classId },
      });
    });

    it('should throw BadRequestException when class has enrollments', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        _count: {
          enrollments: 5,
          teacherClasses: 1,
          attendances: 50,
          announcements: 2,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(5);

      await expect(service.remove(tenantId, classId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when class has teacher assignments', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        _count: {
          enrollments: 0,
          teacherClasses: 2,
          attendances: 0,
          announcements: 0,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(0);
      mockPrismaService.teacherClass.count.mockResolvedValue(2);

      await expect(service.remove(tenantId, classId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getCapacityInfo', () => {
    it('should return capacity information', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 15,
          teacherClasses: 1,
          attendances: 100,
          announcements: 5,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(15);

      const result = await service.getCapacityInfo(tenantId, classId);

      expect(result).toEqual({
        classId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        currentEnrollment: 15,
        availableSlots: 15,
        isAtCapacity: false,
      });
    });

    it('should detect when class is at capacity', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: 30,
        _count: {
          enrollments: 30,
          teacherClasses: 1,
          attendances: 200,
          announcements: 5,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(30);

      const result = await service.getCapacityInfo(tenantId, classId);

      expect(result.isAtCapacity).toBe(true);
      expect(result.availableSlots).toBe(0);
    });

    it('should handle classes without capacity limit', async () => {
      const tenantId = 'tenant-123';
      const classId = 'class-123';

      const mockClass = {
        id: classId,
        tenantId,
        level: 'Grade 1',
        arm: 'A',
        capacity: null,
        _count: {
          enrollments: 50,
          teacherClasses: 1,
          attendances: 300,
          announcements: 5,
        },
      };

      mockPrismaService.class.findFirst.mockResolvedValue(mockClass);
      mockPrismaService.enrollment.count.mockResolvedValue(50);

      const result = await service.getCapacityInfo(tenantId, classId);

      expect(result.availableSlots).toBeNull();
      expect(result.isAtCapacity).toBe(false);
    });
  });

  describe('getLevels', () => {
    it('should return unique levels for a tenant', async () => {
      const tenantId = 'tenant-123';
      const mockClasses = [
        { level: 'Grade 1' },
        { level: 'Grade 2' },
        { level: 'Grade 3' },
      ];

      mockPrismaService.class.findMany.mockResolvedValue(mockClasses);

      const result = await service.getLevels(tenantId);

      expect(result).toEqual(['Grade 1', 'Grade 2', 'Grade 3']);
      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        select: { level: true },
        distinct: ['level'],
        orderBy: { level: 'asc' },
      });
    });
  });
});
