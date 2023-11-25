import { IsEnum, IsString, IsNumber, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { qaMatchingEntity } from 'src/entities';
import { Category } from 'src/common/enums';

export class QuestionDto {
  @IsNumber()
  @ApiProperty({ description: 'Q&A id' })
  id: number;

  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

  @IsString()
  @ApiProperty({ description: 'question' })
  question: string;

  @IsEnum(Category)
  @ApiProperty({ description: 'category' })
  category: Category;

  @IsDate()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  static ToDto(qaEntity: qaMatchingEntity): QuestionDto {
    return {
      id: qaEntity.id,
      nickname: qaEntity.question_user.nickname,
      question: qaEntity.question,
      category: qaEntity.category,
      createdAt: qaEntity.createdAt,
    };
  }
}
