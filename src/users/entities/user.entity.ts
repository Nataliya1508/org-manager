import { hash } from 'bcrypt';
import { IsEmail } from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @IsEmail()
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @ManyToOne(() => UserEntity, (user) => user.subordinates, { nullable: true })
  @JoinColumn({ name: 'bossId' })
  bossId: UserEntity;

  @OneToMany(() => UserEntity, (user) => user.bossId)
  subordinates: UserEntity[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }
}
