import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdService } from './household.service';
import { PrismaService } from '@classpoint/db';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let prisma: PrismaService;

  const mockPrismaService = {
    household: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    householdMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn()
    },
    user: {
      findFirst: jest.fn()
    },
    student: {
      findFirst: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
      ]
    }).compile();

    service = module.get<HouseholdService>(HouseholdService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new household', async () => {
      const tenantId = 'tenant-123';
      const createHouseholdDto = {
        email: 'parent@example.com',
        phone: '+27123456789',
        address: '123 Main Street'
      };

      const mockHousehold = {
        id: 'household-123',
        tenantId,
        email: createHouseholdDto.email,
        phone: createHouseholdDto.phone,
        address: createHouseholdDto.address,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: []
      };

      mockPrismaService.household.findFirst.mockResolvedValue(null);
      mockPrismaService.household.create.mockResolvedValue(mockHousehold);

      const result = await service.create(tenantId, createHouseholdDto);

      expect(result).toEqual({
        id: mockHousehold.id,
        tenantId: mockHousehold.tenantId,
        email: mockHousehold.email,
        phone: mockHousehold.phone,
        address: mockHousehold.address,
        createdAt: mockHousehold.createdAt,
        updatedAt: mockHousehold.updatedAt,
        members: []
    });
      expect(prisma.household.findFirst).toHaveBeenCalledWith({
        where: { tenantId, email: createHouseholdDto.email }
    });
      expect(prisma.household.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          email: createHouseholdDto.email,
          phone: createHouseholdDto.phone,
          address: createHouseholdDto.address
        },
        include: { members: true }
    });
    });

    it('should throw ConflictException if household with email already exists', async () => {
      const tenantId = 'tenant-123';
      const createHouseholdDto = {
        email: 'parent@example.com'
      };

      const existingHousehold = {
        id: 'household-456',
        tenantId,
        email: createHouseholdDto.email
      };

      mockPrismaService.household.findFirst.mockResolvedValue(existingHousehold);

      await expect(service.create(tenantId, createHouseholdDto)).rejects.toThrow(ConflictException);
      expect(prisma.household.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated households', async () => {
      const tenantId = 'tenant-123';
      const mockHouseholds = [
        {
          id: 'household-1',
          tenantId,
          email: 'parent1@example.com',
          phone: '+27123456789',
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'household-2',
          tenantId,
          email: 'parent2@example.com',
          phone: '+27987654321',
          address: '456 Oak Ave',
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];

      mockPrismaService.household.findMany.mockResolvedValue(mockHouseholds);
      mockPrismaService.household.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, 1, 50, false);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prisma.household.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 50,
        include: { members: false },
        orderBy: { createdAt: 'desc' }
    });
    });
  });

  describe('findOne', () => {
    it('should return a household by ID', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';

      const mockHousehold = {
        id: householdId,
        tenantId,
        email: 'parent@example.com',
        phone: '+27123456789',
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: []
      };

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);

      const result = await service.findOne(tenantId, householdId, true);

      expect(result.id).toBe(householdId);
      expect(result.email).toBe('parent@example.com');
      expect(prisma.household.findFirst).toHaveBeenCalledWith({
        where: { id: householdId, tenantId },
        include: {
          members: {
            include: {
              student: { select: { id: true, firstName: true, lastName: true } },
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
    });
    });

    it('should throw NotFoundException if household not found', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'non-existent-id';

      mockPrismaService.household.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tenantId, householdId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return household by email', async () => {
      const tenantId = 'tenant-123';
      const email = 'parent@example.com';

      const mockHousehold = {
        id: 'household-123',
        tenantId,
        email,
        phone: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: []
      };

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);

      const result = await service.findByEmail(tenantId, email);

      expect(result).not.toBeNull();
      expect(result?.email).toBe(email);
    });

    it('should return null if household not found', async () => {
      const tenantId = 'tenant-123';
      const email = 'nonexistent@example.com';

      mockPrismaService.household.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail(tenantId, email);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a household', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';
      const updateDto = {
        phone: '+27999999999',
        address: '789 New Street'
      };

      const existingHousehold = {
        id: householdId,
        tenantId,
        email: 'parent@example.com',
        phone: '+27123456789',
        address: '123 Main St'
      };

      const updatedHousehold = {
        ...existingHousehold,
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: []
      };

      mockPrismaService.household.findFirst.mockResolvedValue(existingHousehold);
      mockPrismaService.household.update.mockResolvedValue(updatedHousehold);

      const result = await service.update(tenantId, householdId, updateDto);

      expect(result.phone).toBe(updateDto.phone);
      expect(result.address).toBe(updateDto.address);
      expect(prisma.household.update).toHaveBeenCalledWith({
        where: { id: householdId },
        data: updateDto,
        include: { members: true }
    });
    });

    it('should throw NotFoundException if household not found', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'non-existent-id';
      const updateDto = { phone: '+27999999999' };

      mockPrismaService.household.findFirst.mockResolvedValue(null);

      await expect(service.update(tenantId, householdId, updateDto)).rejects.toThrow(NotFoundException);
      expect(prisma.household.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a household and its members', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';

      const existingHousehold = {
        id: householdId,
        tenantId,
        email: 'parent@example.com'
      };

      mockPrismaService.household.findFirst.mockResolvedValue(existingHousehold);
      mockPrismaService.householdMember.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.household.delete.mockResolvedValue(existingHousehold);

      await service.remove(tenantId, householdId);

      expect(prisma.householdMember.deleteMany).toHaveBeenCalledWith({
        where: { householdId }
    });
      expect(prisma.household.delete).toHaveBeenCalledWith({
        where: { id: householdId }
    });
    });

    it('should throw NotFoundException if household not found', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'non-existent-id';

      mockPrismaService.household.findFirst.mockResolvedValue(null);

      await expect(service.remove(tenantId, householdId)).rejects.toThrow(NotFoundException);
      expect(prisma.household.delete).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should add a member to a household', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';
      const addMemberDto = {
        relationship: 'Father',
        userId: 'user-123',
        studentId: 'student-123'
      };

      const mockHousehold = { id: householdId, tenantId };
      const mockUser = { id: 'user-123', tenantId };
      const mockStudent = { id: 'student-123', tenantId };
      const mockMember = {
        id: 'member-123',
        householdId,
        userId: addMemberDto.userId,
        studentId: addMemberDto.studentId,
        relationship: addMemberDto.relationship,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.householdMember.findFirst.mockResolvedValue(null);
      mockPrismaService.householdMember.create.mockResolvedValue(mockMember);

      const result = await service.addMember(tenantId, householdId, addMemberDto);

      expect(result.id).toBe('member-123');
      expect(result.relationship).toBe('Father');
      expect(prisma.householdMember.create).toHaveBeenCalledWith({
        data: {
          householdId,
          userId: addMemberDto.userId,
          studentId: addMemberDto.studentId,
          relationship: addMemberDto.relationship
        }
    });
    });

    it('should throw NotFoundException if household not found', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'non-existent-id';
      const addMemberDto = { relationship: 'Father' };

      mockPrismaService.household.findFirst.mockResolvedValue(null);

      await expect(
        service.addMember(tenantId, householdId, addMemberDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.householdMember.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a household', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';
      const memberId = 'member-123';

      const mockHousehold = { id: householdId, tenantId };
      const mockMember = { id: memberId, householdId };

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);
      mockPrismaService.householdMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.householdMember.delete.mockResolvedValue(mockMember);

      await service.removeMember(tenantId, householdId, memberId);

      expect(prisma.householdMember.delete).toHaveBeenCalledWith({
        where: { id: memberId }
    });
    });

    it('should throw NotFoundException if member not found', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';
      const memberId = 'non-existent-member';

      const mockHousehold = { id: householdId, tenantId };

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);
      mockPrismaService.householdMember.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(tenantId, householdId, memberId),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.householdMember.delete).not.toHaveBeenCalled();
    });
  });

  describe('getMembers', () => {
    it('should return all members of a household', async () => {
      const tenantId = 'tenant-123';
      const householdId = 'household-123';

      const mockHousehold = { id: householdId, tenantId };
      const mockMembers = [
        {
          id: 'member-1',
          householdId,
          relationship: 'Father',
          userId: 'user-1',
          studentId: 'student-1',
          createdAt: new Date(),
          student: { id: 'student-1', firstName: 'John', lastName: 'Doe' },
          user: { id: 'user-1', firstName: 'Mike', lastName: 'Doe', email: 'mike@example.com' }
        },
        {
          id: 'member-2',
          householdId,
          relationship: 'Mother',
          userId: 'user-2',
          studentId: 'student-1',
          createdAt: new Date(),
          student: { id: 'student-1', firstName: 'John', lastName: 'Doe' },
          user: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
        },
      ];

      mockPrismaService.household.findFirst.mockResolvedValue(mockHousehold);
      mockPrismaService.householdMember.findMany.mockResolvedValue(mockMembers);

      const result = await service.getMembers(tenantId, householdId);

      expect(result).toHaveLength(2);
      expect(result[0].relationship).toBe('Father');
      expect(result[1].relationship).toBe('Mother');
    });
  });
});
