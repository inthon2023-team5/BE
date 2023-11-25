import { IsString, IsNumber, IsBoolean, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QaChatDto {
  @IsNumber()
  @ApiProperty({ description: 'Q&A id' })
  qaId: number;

  @IsString()
  @ApiProperty({ description: 'chat' })
  chat: string;

  @IsBoolean()
  @ApiProperty({ description: 'Q or not' })
  isQuestion: boolean;

  @ValidateIf((o) => o.questionId != null)
  @IsNumber()
  @ApiProperty({ description: 'question id for professor' })
  questionId: number;
}
