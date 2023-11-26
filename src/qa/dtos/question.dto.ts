import { IsEnum, IsString, IsNumber, IsDate } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { qaMatchingEntity } from 'src/entities';
import { Category, Grade } from 'src/common/enums';

export class QADto {
  @IsNumber()
  @ApiProperty({ description: 'Q&A id' })
  id: number;

  @IsString()
  @ApiProperty({ description: 'question' })
  question: string;

  @IsEnum(Category)
  @ApiProperty({ description: 'category', type: Category })
  category: Category;

  @IsDate()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;
}

export class QuestionListDto extends QADto {
  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

  @IsString()
  @ApiProperty({ description: 'univId' })
  univId: string;

  @IsEnum(Grade)
  @ApiProperty({ description: 'grade', type: Grade })
  grade: Grade;

  static ToDto(qaEntity: qaMatchingEntity): QuestionListDto {
    return {
      id: qaEntity.id,
      nickname: qaEntity.question_user.nickname,
      univId: qaEntity.question_user.univId,
      grade: qaEntity.question_user.grade,
      question: qaEntity.question,
      category: qaEntity.category,
      createdAt: qaEntity.createdAt,
    };
  }
}

export class QuestionDto extends PickType(QADto, [
  'question',
  'category',
] as const) {}
