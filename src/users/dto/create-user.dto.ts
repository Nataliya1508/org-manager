import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Natalia Vasylivna', description: 'Name' })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '1234@A1a', description: 'Password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({
    example: 'boss',
    description: 'Role of the user',
    enum: Role,
    default: Role.User,
  })
  readonly role: Role;

  @ApiProperty({
    example: 1,
    description: 'Identifier of the boss',
    nullable: true,
  })
  readonly bossId?: string;

  @ApiProperty({
    example: [3, 5],
    description: 'List of subordinates',
  })
  subordinates?: string[];
}
