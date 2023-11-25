import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { qaChatEntity, qaMatchingEntity } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([qaMatchingEntity, qaChatEntity]),
  ],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
