import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    const top3 = await this.userService.getTop3(id);
    return res.json({ ...user, top3 });
  }

  @UseGuards(AuthGuard('access'))
  @Get('/qalist')
  @ApiOperation({
    summary: 'Q&A List',
    description: '유저의 Q&A 리스트 가져오기',
  })
  @ApiResponse({
    description: 'question array & answer array',
    type: Object,
    schema: {
      properties: {
        questions: { type: 'array' },
        answers: { type: 'array' },
      },
    },
  })
  async userQalist(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const questions = await this.userService.getUserQuestion(id);
    const answers = await this.userService.getUserAnswer(id);
    return res.json({ questions: questions, answers: answers });
  }
}
