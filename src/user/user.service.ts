import {
  Injectable,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/interfaces/jwt.payload';
import { UserEntity, qaMatchingEntity } from 'src/entities';
import { Repository } from 'typeorm';
import { SignupDto, LoginDto, ProfileDto } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(qaMatchingEntity)
    private readonly matchRepo: Repository<qaMatchingEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async findById(id: number): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { id } });
  }

  async findByNickname(nickname: string): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { nickname: nickname } });
  }

  async findByUnivId(univId: string): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { univId: univId } });
  }

  async signupUser(user: SignupDto) {
    const { name, nickname, email, univId, grade, password } = user;
    if (await this.findByUnivId(univId)) {
      throw new HttpException('duplicated univId', 409);
    }

    const newUser = await this.userRepo.create({
      name: name,
      nickname: nickname,
      email: email,
      univId: univId,
      grade: grade,
      rank: 0,
      password: await bcrypt.hash(password, 10),
      point: 100,
    });
    await this.userRepo.save(newUser);
    return true;
  }

  async loginUser(loginUser: LoginDto) {
    const { univId, password } = loginUser;
    const user = await this.userRepo.findOne({
      where: { univId: univId },
    });
    console.log(await bcrypt.compare(password, user.password));
    if (!user || user == undefined) {
      throw new UnauthorizedException();
    }
    const cmpPw = await bcrypt.compare(password, user.password);
    if (!cmpPw) {
      {
        throw new UnauthorizedException();
      }
    }

    return await this.getToken(user.id);
  }

  async getToken(userId: number) {
    const payload: JwtPayload = {
      id: userId,
      signedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    };
    const token = await this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
    });
    return token;
  }

  async getProfile(id: number) {
    const user = await this.userRepo.findOne({ where: { id: id } });
    const top3Categories = await this.matchRepo
      .createQueryBuilder('match')
      .select('match.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('match.answer_user = :user', { user: user.id })
      .andWhere("match.state = '3'")
      .groupBy('match.category')
      .having('COUNT(*) >= 1')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();
    const top3 = await Promise.all(
      top3Categories.map(async (topCategory) => {
        const { category } = topCategory;
        return category;
      }),
    );
    return ProfileDto.ToDto(user, top3);
  }

  async updatePoint(id: number, point: number) {
    const user = await this.userRepo.findOne({ where: { id: id } });
    user.point += point;
    if (user.point < 0) {
      return false;
    }
    return await this.userRepo.save(user);
  }

  async updateRank(id: number) {
    const user = await this.userRepo.findOne({ where: { id: id } });
    const answeredQAs = await this.matchRepo.find({
      where: { answer_user: user, state: 3 },
    });
    const rank = Math.floor(answeredQAs.length / 4);
    if (rank > 14) return false;

    user.rank = rank;
    await this.userRepo.save(user);
    return rank;
  }

  async getUserQuestion(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const questions = await this.matchRepo.find({
      where: { question_user: user },
    });
    return questions;
  }

  async getUserAnswer(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const answers = await this.matchRepo.find({
      where: { answer_user: user },
    });
    return answers;
  }
}
