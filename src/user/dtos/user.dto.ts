import { IsEmail, IsEnum, IsString, IsNumber } from 'class-validator';
import { ApiProperty, PickType, OmitType } from '@nestjs/swagger';
import { UserEntity } from 'src/entities';
import { Grade } from 'src/common/enums';

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
