import { Grade } from 'src/common/enums';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  univId: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Grade,
  })
  grade: Grade;

  @Column()
  point: number;
}
