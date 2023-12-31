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
  ApiParam,
} from '@nestjs/swagger';
import { QaService } from './qa.service';
import { JwtPayload } from 'src/interfaces/jwt.payload';
import { QuestionDto, QuestionListDto } from './dtos/question.dto';
import { Category } from 'src/common/enums';
import { QaChatDto } from './dtos/chat.dto';
import { UserService } from 'src/user/user.service';
import { AiService } from 'src/ai/ai.service';

@Controller('qa')
@ApiTags('Q&A')
export class QaController {
  constructor(
    private readonly qaService: QaService,
    private readonly userService: UserService,
    private readonly aiService: AiService,
  ) {}

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
    const { question } = questionDto;
    const qaId = await this.qaService.postQuestion(questionDto, id);
    const answer = await this.aiService.questionToAi(question);
    const { text } = answer;
    const chats = await this.qaService.postQaChat(
      { qaId: qaId, isQuestion: false, chat: text, questionId: null },
      null,
    );
    console.log(chats);
    return res.status(201).json({ id: qaId });
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

  @UseGuards(AuthGuard('access'))
  @Get('/chat/:qaId')
  @ApiOperation({
    summary: 'Q&A 상세',
    description: 'Q&A 채팅 내역',
  })
  @ApiParam({
    name: 'qaId',
    type: Number,
  })
  @ApiCreatedResponse({ description: 'success' })
  async getQaChat(
    @Req() req: Request,
    @Param('qaId') qaId: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    try {
      const { state, isQuestionUser, userId } =
        await this.qaService.getOtherUserInQa(qaId, id);
      const chats = await this.qaService.getQaChats(qaId);
      if (userId != null || userId != undefined) {
        const profile = await this.userService.getProfile(userId);
        return res.json({
          profile: profile,
          state: state,
          isQuestionUser: isQuestionUser,
          chats: chats,
        });
      } else {
        return res.json({
          state: state,
          isQuestionUser: isQuestionUser,
          chats: chats,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Get('/profile/chat/:qaId')
  @ApiOperation({
    summary: 'Q&A 상세',
    description: 'Q&A 채팅 내역',
  })
  @ApiParam({
    name: 'qaId',
    type: Number,
  })
  @ApiCreatedResponse({ description: 'success' })
  async getQaChatL(
    @Req() req: Request,
    @Param('qaId') qaId: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    try {
      const { state, isQuestionUser, userId } =
        await this.qaService.getOtherUserInQa(qaId, id);
      const chats = await this.qaService.getQaChats(qaId);
      if (userId != null || userId != undefined) {
        const profile = await this.userService.getProfile(userId);
        return res.json({
          profile: profile,
          state: state,
          isQuestionUser: isQuestionUser,
          chats: chats,
        });
      } else {
        return res.json({
          state: state,
          isQuestionUser: isQuestionUser,
          chats: chats,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/chat')
  @ApiOperation({
    summary: 'Q&A 채팅',
    description: 'Q&A 채팅 보내기',
  })
  @ApiBody({
    description: '채팅 내용',
    type: QaChatDto,
  })
  @ApiCreatedResponse({ description: 'success' })
  async postQaChat(
    @Req() req: Request,
    @Body() qaChatDto: QaChatDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    try {
      const chats = await this.qaService.postQaChat(qaChatDto, id);
      const { qaId, chat } = qaChatDto;
      const state = await this.qaService.getQaState(qaId);
      const isQuestion = await this.qaService.isQuestion(qaId, id);
      if (isQuestion && state == 0) {
        const answer = await this.aiService.questionToAi(chat);
        const { text } = answer;
        const chats = await this.qaService.postQaChat(
          { qaId: qaId, isQuestion: false, chat: text, questionId: null },
          null,
        );
        console.log(chats);
        return res.sendStatus(201);
      }
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }
}
