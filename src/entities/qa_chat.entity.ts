import { QA } from 'src/common/enums';
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

  @Column({
    type: 'enum',
    enum: QA,
  })
  qa: QA;

  @Column()
  chat: string;

  @ManyToOne(() => qaMatchingEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  qaRoom: qaMatchingEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;
}
