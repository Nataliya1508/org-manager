import { ApiProperty } from '@nestjs/swagger';
import { hash } from 'bcrypt';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';

@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'Natalia Vasylivna', description: 'Name' })
  @Column()
  name: string;

  @ApiProperty({ example: '1234@A1a', description: 'Password' })
  @Exclude()
  @Column({ select: false })
  password?: string;

  @ApiProperty({
    example: 'boss',
    description: 'Role of the user',
    enum: Role,
    default: Role.User,
  })
  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @ApiProperty({
    example: 1,
    description: 'Identifier of the boss',
    nullable: true,
  })
  @ManyToOne(() => UserEntity, (user) => user.subordinates, { nullable: true })
  @JoinColumn({ name: 'bossId' })
  bossId: UserEntity;

  @ApiProperty({
    type: () => [UserEntity],
    description: 'List of subordinates',
  })
  @OneToMany(() => UserEntity, (user) => user.bossId)
  subordinates: UserEntity[];

  constructor(user?: CreateUserDto) {
    if (!user) return;
    this.email = user.email;
    this.password = user.password;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
  }
}
