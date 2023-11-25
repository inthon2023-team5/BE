import { UserEntity } from './users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { qaMatchingEntity } from './qa_matching.entity';

@Entity()
export class qaChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isQuestion: boolean;

  @Column({
    nullable: true,
  })
  questionId?: number;

  @Column()
  chat: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => qaMatchingEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  qaMatch: qaMatchingEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;
}
