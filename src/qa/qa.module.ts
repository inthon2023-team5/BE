import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { qaChatEntity, qaMatchingEntity } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([qaMatchingEntity, qaChatEntity])],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
