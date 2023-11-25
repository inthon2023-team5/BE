import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { UserDto } from './dtos/user.dto';
import { JwtPayload } from 'src/interfaces/jwt.payload';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('access'))
  @Get('/info')
  async userInfo(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findById(id);
    return res.json(UserDto.ToDto(user));
  }
}
