import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { QaService } from './qa.service';
import { JwtPayload } from 'src/interfaces/jwt.payload';
import { QuestionDto } from './dtos/question.dto';
import { Category } from 'src/common/enums';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  //@UseGuards(AuthGuard('access'))
  @Get('/list')
  async getQAListAll(@Req() req: Request, @Res() res: Response) {
    //const { id } = req.user as JwtPayload;
    const questionList = await this.qaService.getQuestionListAll();
    return res.json(questionList);
  }

  //@UseGuards(AuthGuard('access'))
  @Get('/list/:category')
  async getQAList(
    @Req() req: Request,
    @Param('category') category: Category,
    @Res() res: Response,
  ) {
    //const { id } = req.user as JwtPayload;
    const questionList = await this.qaService.getQuestionList(category);
    return res.json(questionList);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/new')
  async startQuestion(
    @Req() req: Request,
    @Body() questionDto: QuestionDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    this.qaService.postQuestion(questionDto, id);
    return res.sendStatus(201);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/join')
  async startAnswer(
    @Req() req: Request,
    @Body() question: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    try {
      this.qaService.startAnswer(question, id);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
}
