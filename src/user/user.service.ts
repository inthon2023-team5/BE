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
  /*
  async getProfileById(id: number): Promise<ProfileDto> {
    const user = await this.userRepo.findOne({ where: { id } });

    const top3 = await this.matchRepo
      .createQueryBuilder('match')
      .select('match.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('match.answer_user = :user', { user: user })
      .andWhere('match.state = 3')
      .groupBy('match.category')
      .having('COUNT(*) >= 5')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    return ProfileDto.ToDto(user, top3);
  }
*/
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

    if (
      !user ||
      user == undefined ||
      (await !bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException();
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
}
