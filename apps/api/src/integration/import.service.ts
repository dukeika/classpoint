import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@classpoint/db';
import { ImportDto, ImportResultDto, ExportEntity } from './dto';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Import data from CSV
   */
  async importData(
    tenantId: string,
    importDto: ImportDto
  ): Promise<ImportResultDto> {
    this.logger.log(
      `Importing ${importDto.entity} for tenant: ${tenantId} (dryRun: ${importDto.dryRun})`
    );

    // Decode base64 CSV data
    const csvData = Buffer.from(importDto.fileData, 'base64').toString('utf-8');
    const rows = this.parseCSV(csvData);

    if (rows.length === 0) {
      throw new BadRequestException('No data found in CSV');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const result: ImportResultDto = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      dryRun: importDto.dryRun || false,
    };

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2; // +2 because of header row and 0-index
      const rowData = this.rowToObject(headers, dataRows[i]);

      try {
        if (!importDto.dryRun) {
          switch (importDto.entity) {
            case ExportEntity.STUDENTS:
              await this.importStudent(tenantId, rowData);
              break;
            case ExportEntity.FEE_STATUS:
              await this.importFeeStatus(tenantId, rowData);
              break;
            // Add more entities as needed
            default:
              throw new BadRequestException(`Import not supported for ${importDto.entity}`);
          }
        }
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: (error as Error).message,
        });

        if (!importDto.skipErrors) {
          break; // Stop on first error if skipErrors is false
        }
      }
    }

    this.logger.log(
      `Import completed: ${result.success} success, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Parse CSV into array of arrays
   */
  private parseCSV(csvData: string): string[][] {
    const lines = csvData.split('\n').filter((line) => line.trim());
    const rows: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            currentValue += '"';
            i++; // Skip next quote
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          row.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      row.push(currentValue.trim());
      rows.push(row);
    }

    return rows;
  }

  /**
   * Convert row array to object using headers
   */
  private rowToObject(headers: string[], values: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  }

  /**
   * Import a student
   */
  private async importStudent(tenantId: string, data: Record<string, string>) {
    // Check required fields
    const required = ['Admission Number', 'First Name', 'Last Name', 'Date of Birth', 'Gender'];
    for (const field of required) {
      if (!data[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // Check if student already exists
    const existing = await this.prisma.student.findFirst({
      where: {
        tenantId,
        admissionNumber: data['Admission Number'],
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Student with admission number ${data['Admission Number']} already exists`
      );
    }

    // Create student
    await this.prisma.student.create({
      data: {
        tenantId,
        admissionNumber: data['Admission Number'],
        firstName: data['First Name'],
        lastName: data['Last Name'],
        middleName: data['Middle Name'] || null,
        dateOfBirth: new Date(data['Date of Birth']),
        gender: data['Gender'] as any,
        email: data['Email'] || null,
        phone: data['Phone'] || null,
        address: data['Address'] || null,
        status: (data['Status'] as any) || 'PENDING',
      },
    });
  }

  /**
   * Import fee status
   */
  private async importFeeStatus(tenantId: string, data: Record<string, string>) {
    const required = ['Admission Number', 'Term', 'Status'];
    for (const field of required) {
      if (!data[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // Find student by admission number
    const student = await this.prisma.student.findFirst({
      where: {
        tenantId,
        admissionNumber: data['Admission Number'],
      },
    });

    if (!student) {
      throw new BadRequestException(
        `Student with admission number ${data['Admission Number']} not found`
      );
    }

    // Find term by name
    const term = await this.prisma.term.findFirst({
      where: {
        tenantId,
        name: data['Term'],
      },
    });

    if (!term) {
      throw new BadRequestException(`Term '${data['Term']}' not found`);
    }

    // Create or update fee status
    await this.prisma.feeStatus.upsert({
      where: {
        studentId_termId: {
          studentId: student.id,
          termId: term.id,
        },
      },
      create: {
        tenantId,
        studentId: student.id,
        termId: term.id,
        status: data['Status'] as any,
        updatedBy: 'SYSTEM',
      },
      update: {
        status: data['Status'] as any,
        updatedBy: 'SYSTEM',
      },
    });
  }

  /**
   * Generate import template CSV
   */
  async generateTemplate(entity: ExportEntity): Promise<string> {
    const templates: Record<ExportEntity, string[]> = {
      [ExportEntity.STUDENTS]: [
        'Admission Number',
        'First Name',
        'Last Name',
        'Middle Name',
        'Date of Birth',
        'Gender',
        'Email',
        'Phone',
        'Address',
        'Status',
      ],
      [ExportEntity.FEE_STATUS]: [
        'Admission Number',
        'Term',
        'Status',
      ],
      [ExportEntity.STAFF]: ['First Name', 'Last Name', 'Email', 'Phone', 'Roles'],
      [ExportEntity.CLASSES]: ['Level', 'Arm', 'Capacity'],
      [ExportEntity.ENROLLMENTS]: ['Admission Number', 'Class Level', 'Class Arm', 'Term'],
      [ExportEntity.ATTENDANCE]: ['Admission Number', 'Date', 'Session', 'Status', 'Reason'],
      [ExportEntity.GRADES]: ['Admission Number', 'Subject', 'Assessment Type', 'Term', 'Score'],
      [ExportEntity.EVENTS]: ['Title', 'Description', 'Location', 'Start Time', 'End Time'],
    };

    const headers = templates[entity];
    if (!headers) {
      throw new BadRequestException(`Template not available for ${entity}`);
    }

    return headers.join(',') + '\n';
  }
}
