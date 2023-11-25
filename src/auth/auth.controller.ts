import { Controller, Post, Body, Res } from '@nestjs/common';
import { SignupDto, LoginDto, UserDto } from 'src/user/dtos/user.dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  async signup(@Body() signupUser: SignupDto, @Res() res: Response) {
    try {
      await this.userService.signupUser(signupUser);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }

  @Post('/login')
  async login(@Body() loginUser: LoginDto, @Res() res: Response) {
    try {
      const { univId } = loginUser;
      const token = await this.userService.loginUser(loginUser);
      const user = await this.userService.findByUnivId(univId);
      return res.json({ token: token, userInfo: UserDto.ToDto(user) });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
}
