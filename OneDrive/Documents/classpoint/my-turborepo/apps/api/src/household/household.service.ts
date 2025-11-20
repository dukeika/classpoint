import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Household, HouseholdMember } from '@classpoint/db';
import {
  CreateHouseholdDto,
  UpdateHouseholdDto,
  HouseholdResponseDto,
  HouseholdMemberResponseDto,
  AddMemberDto
} from './dto';

@Injectable()
export class HouseholdService {
  private readonly logger = new Logger(HouseholdService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new household
   */
  async create(tenantId: string,
    createHouseholdDto: CreateHouseholdDto): Promise<HouseholdResponseDto> {
    this.logger.log(`Creating household for tenant: ${tenantId}`);

    // Check if household with this email already exists for this tenant
    const existing = await this.prisma.household.findFirst({
      where: {
        tenantId,
        email: createHouseholdDto.email
      }});

    if (existing) {
      throw new ConflictException(`Household with email '${createHouseholdDto.email}' already exists`);
    }

    try {
      const household = await this.prisma.household.create({
        data: {
          tenantId,
          email: createHouseholdDto.email,
          phone: createHouseholdDto.phone,
          address: createHouseholdDto.address
        },
        include: {
          members: true
        }});

      this.logger.log(`Household created successfully: ${household.id}`);
      return this.mapToResponse(household);
    } catch (error) {
      this.logger.error(
        `Failed to create household: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get all households for a tenant with pagination
   */
  async findAll(tenantId: string,
    page: number = 1,
    limit: number = 50,
    includeMembers: boolean = false): Promise<{ data: HouseholdResponseDto[]; total: number }> {
    this.logger.log(`Fetching households for tenant: ${tenantId}, page: ${page}, limit: ${limit}`);

    const skip = (page - 1) * limit;

    const [households, total] = await Promise.all([
      this.prisma.household.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          members: includeMembers
        },
        orderBy: { createdAt: 'desc' }
      }, this.prisma.household.count({ where: { tenantId } }]);

    return {
      data: households.map((h) => this.mapToResponse(h), total};
  }

  /**
   * Get a single household by ID
   */
  async findOne(tenantId: string,
    id: string,
    includeMembers: boolean = true): Promise<HouseholdResponseDto> {
    this.logger.log(`Fetching household: ${id}`);

    const household = await this.prisma.household.findFirst({
      where: { id, tenantId },
      include: {
        members: includeMembers ? {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        } : false
      }});

    if (!household) {
      throw new NotFoundException(`Household with ID '${id}' not found`);
    }

    return this.mapToResponse(household);
  }

  /**
   * Find household by email
   */
  async findByEmail(tenantId: string,
    email: string): Promise<HouseholdResponseDto | null> {
    this.logger.log(`Finding household by email: ${email}`);

    const household = await this.prisma.household.findFirst({
      where: { tenantId, email },
      include: {
        members: true
      }});

    return household ? this.mapToResponse(household) : null;
  }

  /**
   * Update a household
   */
  async update(tenantId: string,
    id: string,
    updateHouseholdDto: UpdateHouseholdDto): Promise<HouseholdResponseDto> {
    this.logger.log(`Updating household: ${id}`);

    // Check if household exists
    const existing = await this.prisma.household.findFirst({
      where: { id, tenantId }});

    if (!existing) {
      throw new NotFoundException(`Household with ID '${id}' not found`);
    }

    // If email is being updated, check for conflicts
    if (updateHouseholdDto.email && updateHouseholdDto.email !== existing.email) {
      const emailConflict = await this.prisma.household.findFirst({
        where: {
          tenantId,
          email: updateHouseholdDto.email,
          id: { not: id }
        }});

      if (emailConflict) {
        throw new ConflictException(`Household with email '${updateHouseholdDto.email}' already exists`);
      }
    }

    try {
      const household = await this.prisma.household.update({
        where: { id },
        data: updateHouseholdDto,
        include: {
          members: true
        }});

      this.logger.log(`Household updated successfully: ${id}`);
      return this.mapToResponse(household);
    } catch (error) {
      this.logger.error(
        `Failed to update household: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete a household (soft delete - can be implemented later)
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting household: ${id}`);

    const existing = await this.prisma.household.findFirst({
      where: { id, tenantId }});

    if (!existing) {
      throw new NotFoundException(`Household with ID '${id}' not found`);
    }

    try {
      // Delete all household members first (cascade)
      await this.prisma.householdMember.deleteMany({
        where: { householdId: id }});

      // Delete the household
      await this.prisma.household.delete({
        where: { id }});

      this.logger.log(`Household deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete household: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Add a member to a household
   */
  async addMember(tenantId: string,
    householdId: string,
    addMemberDto: AddMemberDto): Promise<HouseholdMemberResponseDto> {
    this.logger.log(`Adding member to household: ${householdId}`);

    // Verify household exists and belongs to tenant
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, tenantId }});

    if (!household) {
      throw new NotFoundException(`Household with ID '${householdId}' not found`);
    }

    // Verify user exists if provided
    if (addMemberDto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: addMemberDto.userId, tenantId }});

      if (!user) {
        throw new NotFoundException(`User with ID '${addMemberDto.userId}' not found`);
      }
    }

    // Verify student exists if provided
    if (addMemberDto.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: addMemberDto.studentId, tenantId }});

      if (!student) {
        throw new NotFoundException(`Student with ID '${addMemberDto.studentId}' not found`);
      }

      // Check if this student is already linked to this household
      const existingLink = await this.prisma.householdMember.findFirst({
        where: {
          householdId,
          studentId: addMemberDto.studentId
        }});

      if (existingLink) {
        throw new ConflictException(`Student is already linked to this household`);
      }
    }

    try {
      const member = await this.prisma.householdMember.create({
        data: {
          householdId,
          userId: addMemberDto.userId,
          studentId: addMemberDto.studentId,
          relationship: addMemberDto.relationship
        }});

      this.logger.log(`Member added to household: ${member.id}`);
      return this.mapMemberToResponse(member);
    } catch (error) {
      this.logger.error(
        `Failed to add member: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Remove a member from a household
   */
  async removeMember(tenantId: string,
    householdId: string,
    memberId: string): Promise<void> {
    this.logger.log(`Removing member ${memberId} from household ${householdId}`);

    // Verify household exists and belongs to tenant
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, tenantId }});

    if (!household) {
      throw new NotFoundException(`Household with ID '${householdId}' not found`);
    }

    // Verify member exists
    const member = await this.prisma.householdMember.findUnique({
      where: { id: memberId }});

    if (!member || member.householdId !== householdId) {
      throw new NotFoundException(`Member with ID '${memberId}' not found in this household`);
    }

    try {
      await this.prisma.householdMember.delete({
        where: { id: memberId }});

      this.logger.log(`Member removed from household: ${memberId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove member: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get all members of a household
   */
  async getMembers(tenantId: string,
    householdId: string): Promise<HouseholdMemberResponseDto[]> {
    this.logger.log(`Fetching members for household: ${householdId}`);

    // Verify household exists and belongs to tenant
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, tenantId }});

    if (!household) {
      throw new NotFoundException(`Household with ID '${householdId}' not found`);
    }

    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }});

    return members.map((m) => this.mapMemberToResponse(m));
  }

  /**
   * Get all students linked to a household
   */
  async getStudents(tenantId: string, householdId: string): Promise<any[]> {
    this.logger.log(`Fetching students for household: ${householdId}`);

    // Verify household exists and belongs to tenant
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, tenantId }});

    if (!household) {
      throw new NotFoundException(`Household with ID '${householdId}' not found`);
    }

    const members = await this.prisma.householdMember.findMany({
      where: {
        householdId,
        studentId: { not: null }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            dateOfBirth: true,
            gender: true,
            status: true,
            enrollments: {
              where: { isCurrent: true },
              include: {
                class: {
                  select: {
                    name: true,
                    level: true
                  }
                },
                term: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }});

    return members.map((m) => m.student);
  }

  /**
   * Map Household entity to response DTO
   */
  private mapToResponse(household: Household & { members?: HouseholdMember[] }): HouseholdResponseDto {
    const response: HouseholdResponseDto = {
      id: household.id,
      tenantId: household.tenantId,
      email: household.email,
      phone: household.phone,
      address: household.address,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt};

    if (household.members) {
      response.members = household.members.map((m) => this.mapMemberToResponse(m));
    }

    return response;
  }

  /**
   * Map HouseholdMember entity to response DTO
   */
  private mapMemberToResponse(member: HouseholdMember): HouseholdMemberResponseDto {
    return {
      id: member.id,
      relationship: member.relationship,
      userId: member.userId,
      studentId: member.studentId,
      createdAt: member.createdAt};
  }
}
