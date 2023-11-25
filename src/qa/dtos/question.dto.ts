import { IsEnum, IsString, IsNumber, IsDate } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { qaMatchingEntity } from 'src/entities';
import { Category } from 'src/common/enums';

export class QADto {
  @IsNumber()
  @ApiProperty({ description: 'Q&A id' })
  id: number;

  @IsString()
  @ApiProperty({ description: 'question' })
  question: string;

  @IsEnum(Category)
  @ApiProperty({ description: 'category' })
  category: Category;

  @IsDate()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;
}

export class QuestionListDto extends QADto {
  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

  static ToDto(qaEntity: qaMatchingEntity): QuestionListDto {
    return {
      id: qaEntity.id,
      nickname: qaEntity.question_user.nickname,
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
