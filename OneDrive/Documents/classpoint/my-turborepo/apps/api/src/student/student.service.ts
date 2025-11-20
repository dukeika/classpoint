import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { Student, StudentStatus, Gender } from '@classpoint/db';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentResponseDto
} from './dto';

export interface FindAllStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  status?: StudentStatus;
  householdId?: string;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new student
   */
  async create(tenantId: string,
    createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    this.logger.log(`Creating student for tenant: ${tenantId}`);

    // Verify household exists if provided
    if (createStudentDto.householdId) {
      const household = await this.prisma.household.findFirst({
        where: {
          id: createStudentDto.householdId,
          tenantId
        }});

      if (!household) {
        throw new NotFoundException(`Household with ID '${createStudentDto.householdId}' not found`);
      }
    }

    // Check if student with this email already exists (if email provided)
    if (createStudentDto.email) {
      const existing = await this.prisma.student.findFirst({
        where: {
          tenantId,
          email: createStudentDto.email
        }});

      if (existing) {
        throw new ConflictException(`Student with email '${createStudentDto.email}' already exists`);
      }
    }

    try {
      const student = await this.prisma.student.create({
        data: {
          tenantId,
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          middleName: createStudentDto.middleName,
          dateOfBirth: new Date(createStudentDto.dateOfBirth),
      gender: createStudentDto.gender,
          email: createStudentDto.email,
          phone: createStudentDto.phone,
          householdId: createStudentDto.householdId,
          status: StudentStatus.ENROLLED, // Default status
        }});

      this.logger.log(`Student created successfully: ${student.id}`);
      return this.mapToResponse(student);
    } catch (error) {
      this.logger.error(
        `Failed to create student: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get all students for a tenant with pagination and filters
   */
  async findAll(tenantId: string,
    params: FindAllStudentsParams = {}): Promise<{ data: StudentResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      status,
      householdId
    } = params;

    this.logger.log(`Fetching students for tenant: ${tenantId}, page: ${page}, limit: ${limit}`);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    // Search filter (firstName, lastName, email)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Household filter
    if (householdId) {
      where.householdId = householdId;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }, this.prisma.student.count({ where }]);

    return {
      data: students.map((s) => this.mapToResponse(s), total};
  }

  /**
   * Get a single student by ID
   */
  async findOne(tenantId: string, id: string): Promise<StudentResponseDto> {
    this.logger.log(`Fetching student: ${id}`);

    const student = await this.prisma.student.findFirst({
      where: { id, tenantId }});

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    return this.mapToResponse(student);
  }

  /**
   * Update a student
   */
  async update(tenantId: string,
    id: string,
    updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
    this.logger.log(`Updating student: ${id}`);

    // Check if student exists
    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId }});

    if (!existing) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    // Verify household exists if provided and being updated
    if (updateStudentDto.householdId && updateStudentDto.householdId !== existing.householdId) {
      const household = await this.prisma.household.findFirst({
        where: {
          id: updateStudentDto.householdId,
          tenantId
        }});

      if (!household) {
        throw new NotFoundException(`Household with ID '${updateStudentDto.householdId}' not found`);
      }
    }

    // If email is being updated, check for conflicts
    if (updateStudentDto.email && updateStudentDto.email !== existing.email) {
      const emailConflict = await this.prisma.student.findFirst({
        where: {
          tenantId,
          email: updateStudentDto.email,
          id: { not: id }
        }});

      if (emailConflict) {
        throw new ConflictException(`Student with email '${updateStudentDto.email}' already exists`);
      }
    }

    try {
      // Build update data
      const updateData: any = {};

      if (updateStudentDto.firstName !== undefined) {
        updateData.firstName = updateStudentDto.firstName;
      }
      if (updateStudentDto.lastName !== undefined) {
        updateData.lastName = updateStudentDto.lastName;
      }
      if (updateStudentDto.middleName !== undefined) {
        updateData.middleName = updateStudentDto.middleName;
      }
      if (updateStudentDto.dateOfBirth !== undefined) {
        updateData.dateOfBirth = new Date(updateStudentDto.dateOfBirth);
      }
      if (updateStudentDto.gender !== undefined) {
        updateData.gender = updateStudentDto.gender;
      }
      if (updateStudentDto.email !== undefined) {
        updateData.email = updateStudentDto.email;
      }
      if (updateStudentDto.phone !== undefined) {
        updateData.phone = updateStudentDto.phone;
      }
      if (updateStudentDto.householdId !== undefined) {
        updateData.householdId = updateStudentDto.householdId;
      }
      if (updateStudentDto.status !== undefined) {
        updateData.status = updateStudentDto.status;
      }

      const student = await this.prisma.student.update({
        where: { id },
        data: updateData});

      this.logger.log(`Student updated successfully: ${id}`);
      return this.mapToResponse(student);
    } catch (error) {
      this.logger.error(
        `Failed to update student: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Delete a student
   */
  async remove(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting student: ${id}`);

    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId }});

    if (!existing) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    try {
      await this.prisma.student.delete({
        where: { id }});

      this.logger.log(`Student deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete student: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get students count by status
   */
  async getCountByStatus(tenantId: string, status: StudentStatus): Promise<number> {
    return this.prisma.student.count({
      where: { tenantId, status }});
  }

  /**
   * Get total students count
   */
  async getTotalCount(tenantId: string): Promise<number> {
    return this.prisma.student.count({ where: { tenantId } });
  }

  /**
   * Map Student entity to response DTO
   */
  private mapToResponse(student: Student): StudentResponseDto {
    return {
      id: student.id,
      tenantId: student.tenantId,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      status: student.status,
      email: student.email,
      phone: student.phone,
      householdId: student.householdId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt};
  }
}
