import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from '@classpoint/db';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: PrismaService;

  const mockPrismaService = {
    tenant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    student: {
      count: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createTenantDto = {
        name: 'Test School',
        code: 'test-school',
        planId: 'plan-123',
        address: '123 Test St',
        phone: '+234123456789',
        email: 'test@school.com',
      };

      const mockPlan = {
        id: 'plan-123',
        tier: 'BASIC',
        studentCap: 5000,
      };

      const mockTenant = {
        id: 'tenant-123',
        schoolName: createTenantDto.name,
        slug: createTenantDto.code,
        address: createTenantDto.address,
        phone: createTenantDto.phone,
        email: createTenantDto.email,
        planId: createTenantDto.planId,
        isActive: true,
        website: null,
        logo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockPlan,
        _count: { students: 0 },
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe('tenant-123');
      expect(result.schoolName).toBe('Test School');
      expect(result.slug).toBe('test-school');
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: createTenantDto.code },
      });
      expect(mockPrismaService.plan.findUnique).toHaveBeenCalledWith({
        where: { id: createTenantDto.planId },
      });
      expect(mockPrismaService.tenant.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createTenantDto = {
        name: 'Test School',
        code: 'existing-slug',
        planId: 'plan-123',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: 'existing-tenant',
        slug: 'existing-slug',
      });

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      const createTenantDto = {
        name: 'Test School',
        code: 'test-school',
        planId: 'non-existent-plan',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of tenants', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          schoolName: 'School 1',
          slug: 'school-1',
          isActive: true,
          email: null,
          phone: null,
          address: null,
          website: null,
          logo: null,
          planId: 'plan-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          plan: { studentCap: 5000 },
          _count: { students: 100 },
        },
        {
          id: 'tenant-2',
          schoolName: 'School 2',
          slug: 'school-2',
          isActive: true,
          email: null,
          phone: null,
          address: null,
          website: null,
          logo: null,
          planId: 'plan-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          plan: { studentCap: 3000 },
          _count: { students: 50 },
        },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrismaService.tenant.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('tenant-1');
      expect(result.data[0].schoolName).toBe('School 1');
      expect(result.data[1].id).toBe('tenant-2');
      expect(result.total).toBe(2);
    });

    it('should filter by active status', async () => {
      const mockActiveTenants = [
        {
          id: 'tenant-1',
          schoolName: 'Active School',
          slug: 'active-school',
          isActive: true,
          email: null,
          phone: null,
          address: null,
          website: null,
          logo: null,
          planId: 'plan-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          plan: { studentCap: 1000 },
          _count: { students: 50 },
        },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(mockActiveTenants);
      mockPrismaService.tenant.count.mockResolvedValue(1);

      const result = await service.findAll({ isActive: true });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].schoolName).toBe('Active School');
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      const mockTenant = {
        id: 'tenant-123',
        schoolName: 'Test School',
        slug: 'test-school',
        isActive: true,
        email: null,
        phone: null,
        address: null,
        website: null,
        logo: null,
        planId: 'plan-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: { studentCap: 2000 },
        _count: { students: 75 },
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-123');

      expect(result.id).toBe('tenant-123');
      expect(result.schoolName).toBe('Test School');
      expect(result.slug).toBe('test-school');
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });


  describe('update', () => {
    it('should update tenant information', async () => {
      const updateDto = {
        name: 'Updated School Name',
        phone: '+234987654321',
      };

      const mockExisting = {
        id: 'tenant-123',
        schoolName: 'Old Name',
        slug: 'test-school',
        isActive: true,
        email: null,
        phone: null,
        address: null,
        website: null,
        logo: null,
        planId: 'plan-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: { studentCap: 1000 },
        _count: { students: 100 },
      };

      const mockUpdated = {
        ...mockExisting,
        schoolName: updateDto.name,
        phone: updateDto.phone,
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockExisting);
      mockPrismaService.tenant.update.mockResolvedValue(mockUpdated);

      const result = await service.update('tenant-123', updateDto);

      expect(result.schoolName).toBe('Updated School Name');
      expect(result.phone).toBe(updateDto.phone);
    });
  });

  describe('remove', () => {
    it('should deactivate a tenant', async () => {
      const mockTenant = {
        id: 'tenant-123',
        schoolName: 'Test School',
        slug: 'test-school',
        isActive: true,
        email: null,
        phone: null,
        address: null,
        website: null,
        logo: null,
        planId: 'plan-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: { studentCap: 1000 },
        _count: { students: 0 },
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.student.count.mockResolvedValue(0);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        isActive: false,
      });

      await service.remove('tenant-123');

      expect(mockPrismaService.student.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
      });
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: { isActive: false },
      });
    });
  });
});
