import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserEntity, qaMatchingEntity } from 'src/entities';
import { UserController } from './user.controller';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([UserEntity, qaMatchingEntity]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
