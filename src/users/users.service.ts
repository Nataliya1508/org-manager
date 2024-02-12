import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Role } from 'src/roles/enums/role.enum';
import { FindOperator, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);

    if (
      createUserDto.role === Role.Boss &&
      (!createUserDto.subordinates || createUserDto.subordinates.length === 0)
    ) {
      throw new HttpException(
        'Boss must have subordinates',
        HttpStatus.BAD_REQUEST,
      );
    } else if (createUserDto.role !== Role.Admin && !createUserDto.bossId) {
      throw new HttpException('Boss is required', HttpStatus.BAD_REQUEST);
    }
    const userByEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userByEmail) {
      throw new HttpException('Email is already in use ', HttpStatus.CONFLICT);
    }
    if (createUserDto.subordinates) {
      const subordinates = await Promise.all(
        createUserDto.subordinates.map((subId) =>
          this.userRepository.findOne({
            where: { id: new FindOperator('equal', parseInt(subId, 10)) },
          }),
        ),
      );

      if (subordinates.some((subordinate) => !subordinate)) {
        throw new HttpException(
          'One or more subordinates not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      newUser.subordinates = subordinates;
    }
    if (
      (!createUserDto.role || createUserDto.role === Role.User) &&
      createUserDto.subordinates &&
      createUserDto.subordinates.length > 0
    ) {
      newUser.role = Role.Boss;
    }
    return await this.userRepository.save(newUser);
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll() {
    const users = await this.userRepository.find();
    return users;
  }

  async findBossAndSubordinates(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subordinates'],
    });

    return user;
  }

  async updateBoss(userId: number, newBossId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const newBoss = await this.userRepository.findOne({
      where: { id: newBossId },
    });

    if (!newBoss) {
      throw new NotFoundException(`New boss with id ${newBossId} not found`);
    }

    user.bossId = newBoss;
    return this.userRepository.save(user);
  }
}
