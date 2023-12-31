import { Grade, Rank } from 'src/common/enums';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nickname: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  univId: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Grade,
  })
  grade: Grade;

  @Column({
    type: 'enum',
    enum: Rank,
    default: 0,
  })
  rank: Rank;

  @Column()
  point: number;
}
