import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserResponseInterface } from 'src/common/types/userResponse.interface';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
      constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
    @Post('register')
       @UsePipes(new ValidationPipe())
  async register(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.createUser(createUserDto);
   }
    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto): Promise<UserResponseInterface> {
        return this.authService.login(loginUserDto)
    }

}
