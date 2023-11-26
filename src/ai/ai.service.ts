import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { qaChatEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(qaChatEntity)
    private readonly chatRepo: Repository<qaChatEntity>,
  ) {}

  @Cron('0 19 * * *')
  async handleCron() {
    await import('./updateVector.mjs').then(async (aiModule) => {
      const chatdata = await this.chunkQA();
      await aiModule.updateVector(process.env.OPENAI_API_KEY, chatdata);
    });
  }

  async chunkQA() {
    const qaChunks = await this.chatRepo
      .query(`SELECT qme.id AS ChatRoomId, qce.chat, qce."isQuestion"
    FROM qa_chat_entity qce
    JOIN qa_matching_entity qme ON qce."qaMatchId" = qme.id
    WHERE qce."userId" IS NOT NULL
    ORDER BY qme.id, qce."createdAt";`);
    return qaChunks;
  }

  async questionToAi(question: string) {
    let answer: any;
    await import('./ai.mjs').then(async (aiModule) => {
      answer = await aiModule.run(question, process.env.OPENAI_API_KEY);
    });

    return answer;
  }
}
