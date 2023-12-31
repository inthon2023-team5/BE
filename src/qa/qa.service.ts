import {
  Injectable,
  HttpException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { Category, State } from 'src/common/enums';
import { qaChatEntity, qaMatchingEntity } from 'src/entities';
import { Repository, DeepPartial } from 'typeorm';
import { QuestionDto, QuestionListDto } from './dtos/question.dto';
import { UserService } from 'src/user/user.service';
import { QaChatDto } from './dtos/chat.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(qaChatEntity)
    private readonly chatRepo: Repository<qaChatEntity>,
    @InjectRepository(qaMatchingEntity)
    private readonly matchRepo: Repository<qaMatchingEntity>,
    private readonly userService: UserService,
    private readonly aiService: AiService,
  ) {}

  async getQaState(qaId: number) {
    const qaRoom = await this.matchRepo.findOne({
      where: { id: qaId },
    });
    return qaRoom.state;
  }

  async getOtherUserInQa(qaId: number, userId: number) {
    const qaRoom = await this.matchRepo.findOne({
      where: { id: qaId },
      relations: ['question_user', 'answer_user'],
    });
    if (!qaRoom || qaRoom == null) {
      throw new HttpException('invalid Q&A page', 404);
    }

    if (qaRoom.question_user.id == userId) {
      return {
        isQuestionUser: true,
        userId: qaRoom.answer_user ? qaRoom.answer_user.id : null,
        state: qaRoom.state,
      };
    } else {
      return {
        isQuestionUser: false,
        userId: qaRoom.question_user.id,
        state: qaRoom.state,
      };
    }
  }

  async postQuestion(questionDto: QuestionDto, questionUser: number) {
    const { question, category } = questionDto;
    const user = await this.userService.findById(questionUser);

    const qaEntity = await this.matchRepo.create({
      question: question,
      state: 0,
      category: category,
      question_user: user,
      answer_user: null,
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
    const qaMatchEntity = await this.matchRepo.save(qaEntity);
    await this.postQaChat(
      {
        qaId: qaMatchEntity.id,
        questionId: qaMatchEntity.id,
        chat: question,
        isQuestion: true,
      },
      questionUser,
    );

    return qaMatchEntity.id;
  }

  async startAnswer(id: number, answerUser: number) {
    const qaMatch = await this.matchRepo.findOne({ where: { id: id } });
    if (!qaMatch || qaMatch == null) {
      throw new BadRequestException('invalid question');
    }

    if (qaMatch.state == 1) {
      const user = await this.userService.findById(answerUser);
      this.matchRepo.update(id, { state: 2, answer_user: user });
    } else {
      throw new BadRequestException('already matched');
    }
  }

  async changeQaState(id: number, state: State) {
    if (state == 3) {
      const qaEntity = await this.matchRepo.findOne({
        where: { id: id },
        relations: ['answer_user'],
      });
      console.log(qaEntity.id, id);
      await this.userService.updatePoint(qaEntity.answer_user.id, 10);
      await this.userService.updateRank(qaEntity.answer_user.id);
    }
    this.matchRepo.update(id, { state: state });
  }

  async getQuestionList(category: Category) {
    if (category == 'COURSE') {
      const courses = ['OS', 'CA', 'NETWORK', 'ALGORITHM', 'DS', 'DB', 'AI'];
      const questions = await this.matchRepo.find({
        where: { category: In(courses), state: 1 },
        relations: ['question_user'],
      });
      const questionList = await Promise.all(
        questions.map(async (question) => {
          return await QuestionListDto.ToDto(question);
        }),
      );
      return questionList;
    }
    const questions = await this.matchRepo.find({
      where: { category: category, state: 1 },
      relations: ['question_user'],
    });
    const questionList = await Promise.all(
      questions.map(async (question) => {
        return await QuestionListDto.ToDto(question);
      }),
    );
    return questionList;
  }

  async getQuestionListAll() {
    const questions = await this.matchRepo.find({
      where: { state: 1 },
      relations: ['question_user'],
    });
    const questionList = await Promise.all(
      questions.map(async (question) => {
        return await QuestionListDto.ToDto(question);
      }),
    );
    return questionList;
  }

  async getQaChats(qaId: number) {
    const qaMatch = await this.matchRepo.findOne({ where: { id: qaId } });
    const chats = await this.chatRepo.find({
      where: { qaMatch: qaMatch },
      order: { createdAt: 'ASC' },
    });
    return chats;
  }

  async isQuestion(qaId: number, userId: number) {
    const qaRoom = await this.matchRepo.findOne({
      where: { id: qaId },
      relations: ['question_user'],
    });
    return qaRoom.question_user.id == userId;
  }

  async postQaChat(qaChat: QaChatDto, userId: number) {
    const { chat, qaId, questionId } = qaChat;
    const qaRoom = await this.matchRepo.findOne({
      where: { id: qaId },
      relations: ['question_user'],
    });
    const qaChatEntity = await this.chatRepo.create({
      isQuestion: userId == qaRoom.question_user.id,
      chat: chat,
      qaMatch: qaId,
      user: userId,
      questionId: questionId ?? null,
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    } as DeepPartial<qaChatEntity>);
    await this.chatRepo.save(qaChatEntity);
  }
}
