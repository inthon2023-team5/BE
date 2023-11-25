import { Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AiService } from './ai.service';

// import { run } from './ai.mjs';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  async startAI(@Res() res: Response, @Req() req: Request) {
    let answer: any;
    const { question } = req.body;
    await import('./ai.mjs').then(async (aiModule) => {
      answer = await aiModule.run(question);
    });
    console.log(answer);
    res.send(answer);
  }
}
