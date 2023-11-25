import {
  Injectable,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/common/enums';
import { qaChatEntity, qaMatchingEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(qaChatEntity)
    private readonly chatRepo: Repository<qaChatEntity>,
    @InjectRepository(qaMatchingEntity)
    private readonly matchRepo: Repository<qaMatchingEntity>,
  ) {}

  async postQuestion() {}

  async endQuestion() {}

  async getQuestionList(category: Category) {
    const questions = await this.matchRepo.find({
      where: { category: category, state: 1 },
      relations: ['question_user'],
    });
    return questions;
  }
}
