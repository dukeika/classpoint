import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentType } from './create-comment.dto';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Comment type', enum: CommentType, required: false })
  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType;

  @ApiProperty({ description: 'Comment text', required: false })
  @IsOptional()
  @IsString()
  text?: string;
}
