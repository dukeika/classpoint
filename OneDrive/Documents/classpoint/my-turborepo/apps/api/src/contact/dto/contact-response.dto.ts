import { ApiProperty } from '@nestjs/swagger';
import { ContactSubmission, ContactStatus, ContactSubject } from '@classpoint/db';

export class ContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ enum: ContactSubject })
  subject: ContactSubject;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: ContactStatus })
  status: ContactStatus;

  @ApiProperty({ required: false })
  repliedAt?: Date | null;

  @ApiProperty({ required: false })
  repliedBy?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: ContactSubmission): ContactResponseDto {
    const dto = new ContactResponseDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.phone = entity.phone;
    dto.subject = entity.subject;
    dto.message = entity.message;
    dto.status = entity.status;
    dto.repliedAt = entity.repliedAt;
    dto.repliedBy = entity.repliedBy;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
