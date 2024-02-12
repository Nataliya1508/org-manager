import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';


export class CreateUserDto {
@IsNotEmpty()
@IsString()
readonly name: string;

 @IsNotEmpty()
@IsEmail()
readonly email: string;
    
@IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;
    
  readonly role: Role;

  readonly bossId?: string;
    
   
  subordinates?: string[];
}