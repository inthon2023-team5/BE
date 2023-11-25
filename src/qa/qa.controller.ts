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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { QaService } from './qa.service';
import { JwtPayload } from 'src/interfaces/jwt.payload';
import { QuestionDto, QuestionListDto } from './dtos/question.dto';
import { Category } from 'src/common/enums';

@Controller('qa')
@ApiTags('Q&A')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  //@UseGuards(AuthGuard('access'))
  @Get('/list')
  @ApiOperation({
    summary: '전체 카테고리 Q&A',
    description: '전체 카테고리에 대한 Q&A 리스트',
  })
  @ApiResponse({
    description: 'Q&A 리스트',
    type: QuestionListDto,
    isArray: true,
  })
  async getQAListAll(@Req() req: Request, @Res() res: Response) {
    //const { id } = req.user as JwtPayload;
    const questionList = await this.qaService.getQuestionListAll();
    return res.json(questionList);
  }

  //@UseGuards(AuthGuard('access'))
  @Get('/list/:category')
  @ApiOperation({
    summary: '카테고리 별 Q&A',
    description: '카테고리에 대한 Q&A 리스트',
  })
  @ApiResponse({
    description: 'Q&A 리스트',
    type: QuestionListDto,
    isArray: true,
  })
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
  @ApiOperation({
    summary: '새 Q&A 등록',
    description: '새 Q&A 등록',
  })
  @ApiBody({
    description: 'question 등록 시 필요',
    type: QuestionDto,
  })
  @ApiCreatedResponse({ description: 'success' })
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
  @ApiOperation({
    summary: 'Q&A 참가',
    description: '답변자로 Q&A join 하기',
  })
  @ApiBody({
    description: 'qaId',
    type: Number,
  })
  @ApiCreatedResponse({ description: 'success' })
  async startAnswer(@Req() req: Request, @Body() info, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      const { qaId } = info;
      await this.qaService.startAnswer(qaId, id);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/endAI')
  @ApiOperation({
    summary: 'AI 답변 끝내기',
    description: '질문자가 AI답변 끝내기',
  })
  @ApiBody({
    description: 'qaId',
    type: Number,
  })
  @ApiCreatedResponse({ description: 'success' })
  async endQawithAI(@Req() req: Request, @Body() info, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      const { qaId } = info;
      this.qaService.changeQaState(qaId, 1);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/end')
  @ApiOperation({
    summary: 'Q&A 끝내기',
    description: '질문자가 Q&A 끝내기',
  })
  @ApiBody({
    description: 'qaId',
    type: Number,
  })
  @ApiCreatedResponse({ description: 'success' })
  async endQa(@Req() req: Request, @Body() info, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      const { qaId } = info;
      this.qaService.changeQaState(qaId, 3);
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  // TEST
  @Get()
  async testChunk() {
    this.qaService.chunkQA();
  }
}
