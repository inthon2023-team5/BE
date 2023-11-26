import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QaService } from 'src/qa/qa.service';

@Injectable()
export class AiService {
  constructor(private readonly qaService: QaService) {}

  @Cron('0 19 * * *')
  async handleCron() {
    await import('./updateVector.mjs').then(async (aiModule) => {
      const chatdata = await this.qaService.chunkQA();
      await aiModule.updateVector(process.env.OPENAI_API_KEY, chatdata);
    });
  }
}
