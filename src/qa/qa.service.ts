import {
  Injectable,
  HttpException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, State } from 'src/common/enums';
import { qaChatEntity, qaMatchingEntity } from 'src/entities';
import { Repository, DeepPartial } from 'typeorm';
import { QuestionDto, QuestionListDto } from './dtos/question.dto';
import { UserService } from 'src/user/user.service';
import { QaChatDto } from './dtos/chat.dto';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(qaChatEntity)
    private readonly chatRepo: Repository<qaChatEntity>,
    @InjectRepository(qaMatchingEntity)
    private readonly matchRepo: Repository<qaMatchingEntity>,
    private readonly userService: UserService,
  ) {}

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

    this.postQaChat(
      {
        qaId: qaMatchEntity.id,
        questionId: qaMatchEntity.id,
        chat: question,
        isQuestion: true,
      },
      questionUser,
    );
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
    this.matchRepo.update(id, { state: state });
  }

  async getQuestionList(category: Category) {
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
      order: { questionId: 'ASC', createdAt: 'ASC' },
    });
    return chats;
  }

  async postQaChat(qaChat: QaChatDto, userId: number) {
    const { isQuestion, chat, qaId } = qaChat;
    const qaChatEntity = await this.chatRepo.create({
      isQuestion: isQuestion,
      chat: chat,
      qaMatch: qaId,
      user: userId,
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    } as DeepPartial<qaChatEntity>);
    await this.chatRepo.save(qaChatEntity);
  }
}
