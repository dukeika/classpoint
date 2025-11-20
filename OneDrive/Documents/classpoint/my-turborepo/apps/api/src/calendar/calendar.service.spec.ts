import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { PrismaService } from '@classpoint/db';
import { CalendarView } from './dto';

describe('CalendarService', () => {
  let service: CalendarService;
  let prisma: PrismaService;

  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCalendarView', () => {
    it('should return month calendar view', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.MONTH,
        date: '2024-03-15',
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'School Assembly',
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:00:00Z'),
          isPublic: true,
          isRecurring: false,
          term: { id: 'term-1', name: 'First Term' },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getCalendarView(tenantId, query);

      expect(result.events).toEqual(mockEvents);
      expect(result.view).toBe(CalendarView.MONTH);
      expect(result.period.start).toBeDefined();
      expect(result.period.end).toBeDefined();
      expect(result.period.label).toContain('March');
    });

    it('should return week calendar view', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.WEEK,
        date: '2024-03-15',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      const result = await service.getCalendarView(tenantId, query);

      expect(result.view).toBe(CalendarView.WEEK);
      expect(result.period.label).toContain('Week of');
    });

    it('should return day calendar view', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.DAY,
        date: '2024-03-15',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      const result = await service.getCalendarView(tenantId, query);

      expect(result.view).toBe(CalendarView.DAY);
      expect(result.period.start.getHours()).toBe(0);
      expect(result.period.end.getHours()).toBe(23);
    });

    it('should return agenda calendar view', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.AGENDA,
        date: '2024-03-15',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      const result = await service.getCalendarView(tenantId, query);

      expect(result.view).toBe(CalendarView.AGENDA);
      expect(result.period.label).toBe('Next 30 Days');
    });

    it('should filter by termId', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.MONTH,
        date: '2024-03-15',
        termId: 'term-123',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      await service.getCalendarView(tenantId, query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            termId: 'term-123',
          }),
        })
      );
    });

    it('should filter public events only', async () => {
      const tenantId = 'tenant-123';
      const query = {
        view: CalendarView.MONTH,
        date: '2024-03-15',
        publicOnly: true,
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      await service.getCalendarView(tenantId, query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            isPublic: true,
          }),
        })
      );
    });
  });

  describe('getEventsInRange', () => {
    it('should return events within date range', async () => {
      const tenantId = 'tenant-123';
      const query = {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:00:00Z'),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsInRange(tenantId, query);

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            AND: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by termId in range query', async () => {
      const tenantId = 'tenant-123';
      const query = {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        termId: 'term-123',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);

      await service.getEventsInRange(tenantId, query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            termId: 'term-123',
          }),
        })
      );
    });
  });

  describe('exportToICS', () => {
    it('should generate ICS format calendar', async () => {
      const tenantId = 'tenant-123';
      const query = {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      const mockTenant = {
        schoolName: 'Test School',
        email: 'test@school.com',
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'School Assembly',
          description: 'Weekly assembly',
          location: 'Main Hall',
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:00:00Z'),
          isPublic: true,
          isRecurring: false,
          recurrenceRule: null,
          tenantId,
          termId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.exportToICS(tenantId, query);

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('VERSION:2.0');
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('SUMMARY:School Assembly');
      expect(result).toContain('DESCRIPTION:Weekly assembly');
      expect(result).toContain('LOCATION:Main Hall');
      expect(result).toContain('END:VEVENT');
      expect(result).toContain('END:VCALENDAR');
    });

    it('should handle events with special characters in ICS export', async () => {
      const tenantId = 'tenant-123';
      const query = {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Parent-Teacher Meeting; Room A,B',
          description: 'Important\nMeeting',
          location: null,
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:00:00Z'),
          isPublic: true,
          isRecurring: false,
          recurrenceRule: null,
          tenantId,
          termId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        schoolName: 'Test School',
      });

      const result = await service.exportToICS(tenantId, query);

      // Check that special characters are escaped
      expect(result).toContain('\\;');
      expect(result).toContain('\\,');
      expect(result).toContain('\\n');
    });

    it('should include recurrence rule in ICS export', async () => {
      const tenantId = 'tenant-123';
      const query = {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Weekly Meeting',
          description: null,
          location: null,
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:00:00Z'),
          isPublic: true,
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR',
          tenantId,
          termId: 'term-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        schoolName: 'Test School',
      });

      const result = await service.exportToICS(tenantId, query);

      expect(result).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR');
    });
  });

  describe('getConflictingEvents', () => {
    it('should find conflicting events', async () => {
      const tenantId = 'tenant-123';
      const startTime = new Date('2024-03-15T09:00:00Z');
      const endTime = new Date('2024-03-15T10:00:00Z');

      const mockConflicts = [
        {
          id: 'event-1',
          title: 'Conflicting Event',
          startTime: new Date('2024-03-15T09:30:00Z'),
          endTime: new Date('2024-03-15T10:30:00Z'),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockConflicts);

      const result = await service.getConflictingEvents(
        tenantId,
        startTime,
        endTime
      );

      expect(result).toEqual(mockConflicts);
    });

    it('should exclude specific event when checking conflicts', async () => {
      const tenantId = 'tenant-123';
      const startTime = new Date('2024-03-15T09:00:00Z');
      const endTime = new Date('2024-03-15T10:00:00Z');
      const excludeEventId = 'event-2';

      mockPrismaService.event.findMany.mockResolvedValue([]);

      await service.getConflictingEvents(
        tenantId,
        startTime,
        endTime,
        excludeEventId
      );

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { id: excludeEventId },
          }),
        })
      );
    });
  });

  describe('getCalendarStats', () => {
    it('should return calendar statistics', async () => {
      const tenantId = 'tenant-123';

      mockPrismaService.event.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60) // upcoming
        .mockResolvedValueOnce(40) // past
        .mockResolvedValueOnce(75); // public

      const result = await service.getCalendarStats(tenantId);

      expect(result).toEqual({
        totalEvents: 100,
        upcomingEvents: 60,
        pastEvents: 40,
        publicEvents: 75,
        privateEvents: 25,
      });
    });

    it('should filter stats by termId', async () => {
      const tenantId = 'tenant-123';
      const termId = 'term-123';

      mockPrismaService.event.count.mockResolvedValue(10);

      await service.getCalendarStats(tenantId, termId);

      // Check that all count calls include termId
      const calls = mockPrismaService.event.count.mock.calls;
      calls.forEach((call) => {
        expect(call[0].where).toHaveProperty('termId', termId);
      });
    });
  });
});
