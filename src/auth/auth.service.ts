import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { UserResponseInterface } from 'src/common/types/userResponse.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  generateJwt(user: UserEntity): string {
    const { id, role } = user;
    const jwtPayload = { id, role };

    return sign(jwtPayload, process.env.JWT_SECRET) as string;
  }

  CreateUserResponse(user: UserEntity): UserResponseInterface {
    return { ...user, token: this.generateJwt(user) };
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponseInterface> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
      select: [
        'id',
        'email',
        'name',
        'password',
        'role',
        'subordinates',
        'boss',
      ],
      relations: ['subordinates'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordCorrect = await compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new BadRequestException('Invalid password provided');
    }
    const userResponse: UserResponseInterface = {
      ...user,
      token: this.generateJwt(user),
    };
    delete user.password;
    return userResponse;
  }
}
