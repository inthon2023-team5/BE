import { Category, State } from 'src/common/enums';
import { UserEntity } from './users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class qaMatchingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column({
    type: 'enum',
    enum: State,
    default: 0,
  })
  state: State;

  @Column({
    type: 'enum',
    enum: Category,
  })
  category: Category;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  question_user: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  answer_user: UserEntity;

  @Column()
  createdAt: Date;
}
