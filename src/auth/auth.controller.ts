import { Controller, Post, Body, Res } from '@nestjs/common';
import { SignupDto, LoginDto, UserDto } from 'src/user/dtos/user.dto';
import { Response } from 'express';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  @ApiBody({
    description: '유저 정보',
    type: SignupDto,
  })
  @ApiOperation({
    summary: '회원가입',
    description: '회원가입 진행',
  })
  async signup(@Body() signupUser: SignupDto, @Res() res: Response) {
    try {
      await this.userService.signupUser(signupUser);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @Post('/login')
  @ApiBody({
    description: '유저 정보',
    type: LoginDto,
  })
  @ApiOperation({
    summary: '로그인',
    description: '로그인 진행 후 토큰 및 정보 반환',
  })
  @ApiResponse({
    description: '토큰 및 정보 반환',
    type: UserDto,
  })
  async login(@Body() loginUser: LoginDto, @Res() res: Response) {
    try {
      const { univId } = loginUser;
      const token = await this.userService.loginUser(loginUser);
      const user = await this.userService.findByUnivId(univId);
      return res.json({ token: token, userInfo: UserDto.ToDto(user) });
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @Post('/checkNickname')
  @ApiBody({
    description: '닉네임',
    type: String,
  })
  @ApiOperation({
    summary: '닉네임 중복 확인',
    description: '중복 확인 후 반환',
  })
  @ApiResponse({
    description: 'false/true',
    type: Boolean,
  })
  async checkNickname(@Body() info, @Res() res: Response) {
    const { nickname } = info;
    const unique = await this.userService.findByNickname(nickname);
    if (unique) {
      return res.send(false);
    } else {
      return res.send(true);
    }
  }
}
