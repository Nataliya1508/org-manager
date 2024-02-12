import { ApiProperty } from '@nestjs/swagger';
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
  @Column({ select: false })
  password: string;

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

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }
}
