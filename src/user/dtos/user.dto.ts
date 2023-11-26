import {
  IsEmail,
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, PickType, OmitType } from '@nestjs/swagger';
import { UserEntity } from 'src/entities';
import { Category, Grade, Rank } from 'src/common/enums';

export class UserDto {
  @IsString()
  @ApiProperty({ description: 'name' })
  name: string;

  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

  @IsEmail()
  @ApiProperty({ description: 'email' })
  email: string;

  @IsString()
  @ApiProperty({ description: 'univId' })
  univId: string;

  @IsEnum(Grade)
  @ApiProperty({ description: 'grade' })
  grade: Grade;

  @IsEnum(Rank)
  @ApiProperty({ description: 'rank' })
  rank: Rank;

  @IsNumber()
  @ApiProperty({ description: 'point' })
  point: number;

  static ToDto(user: UserEntity): UserDto {
    return {
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      univId: user.univId,
      grade: user.grade,
      rank: user.rank,
      point: user.point,
    };
  }
}

export class SignupDto extends OmitType(UserDto, ['point'] as const) {
  @IsString()
  @ApiProperty({ description: 'password' })
  password: string;
}

export class LoginDto extends PickType(SignupDto, [
  'univId',
  'password',
] as const) {}

export class ProfileDto extends PickType(UserDto, [
  'nickname',
  'univId',
  'grade',
  'rank',
] as const) {
  @ValidateIf((o) => o.top3 !== undefined && o.top3 !== null)
  @IsArray()
  @IsEnum(Category, { each: true })
  @ApiProperty({
    description: 'top3',
    enum: Category,
    enumName: 'Category',
    isArray: true,
  })
  top3: Category[];

  static ToDto(user: UserEntity, top3: Category[]): ProfileDto {
    return {
      nickname: user.nickname,
      univId: user.univId,
      grade: user.grade,
      rank: user.rank,
      top3: top3 ?? [],
    };
  }
}
