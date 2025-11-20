import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CommentType {
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  HOUSEMASTER = 'housemaster',
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'Term ID' })
  @IsString()
  @IsNotEmpty()
  termId!: string;

  @ApiProperty({ description: 'Author ID (user making the comment)' })
  @IsString()
  @IsNotEmpty()
  authorId!: string;

  @ApiProperty({
    description: 'Type of comment',
    enum!: CommentType,
    example!: CommentType.TEACHER;
  })
  @IsEnum(CommentType)
  type!: CommentType;

  @ApiProperty({ description: 'Comment text' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
