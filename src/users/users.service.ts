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
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    let newUser: UserEntity;

    const { role, subordinates, bossId, email } = createUserDto;

    if (role === Role.Boss && (!subordinates || subordinates.length === 0)) {
      throw new HttpException(
        'Boss must have subordinates',
        HttpStatus.BAD_REQUEST,
      );
    } else if (role !== Role.Admin && !bossId) {
      throw new HttpException('Boss is required', HttpStatus.BAD_REQUEST);
    }

    const userByEmail = await this.userRepository.findOne({
      where: { email: email },
    });
    if (userByEmail) {
      throw new HttpException('Email is already in use ', HttpStatus.CONFLICT);
    }

    if (!role || role === Role.User || subordinates.length === 0) {
      newUser = new UserEntity(createUserDto);
      newUser.password = await hash(createUserDto.password, 10);
      return await this.userRepository.save(newUser);
    } else if (role === Role.Admin || role === Role.Boss) {
      newUser = new UserEntity(createUserDto);
      if (subordinates) {
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

        newUser.password = await hash(createUserDto.password, 10);
        newUser.subordinates = subordinates;
      }
      return await this.userRepository.save(newUser);
    }
  }

  async getUser(
    userId: number = null,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserEntity[]> {
    const offset = (page - 1) * limit;
    const query = this.userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.bossId',
      ])
      .leftJoinAndSelect('user.subordinates', 'subordinates');

    if (userId) {
      query.where('user.id = :id', { id: userId });
    }

    const results = await query.getRawMany();

    const users: UserEntity[] = [];

    for (const result of results) {
      const { user_id, user_name, user_email, user_role, user_bossId } = result;

      const user: UserEntity = {
        id: user_id,
        name: user_name,
        email: user_email,
        role: user_role,
        bossId: user_bossId,
        subordinates: [],
      };

      if (result.subordinates_id) {
        const subordinates = await this.getUser(
          result.subordinates_id,
          1,
          limit,
        );
        user.subordinates = subordinates;
      }

      users.push(user);
    }

    return users.slice(offset, offset + limit);
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<UserEntity[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.bossId',
      ])
      .leftJoinAndSelect('user.subordinates', 'subordinates');

    const results = await query.getRawMany();

    const users: UserEntity[] = [];

    for (const result of results) {
      const { user_id, user_name, user_email, user_role, user_bossId } = result;
      const user: UserEntity = {
        id: user_id,
        name: user_name,
        email: user_email,
        role: user_role,
        bossId: user_bossId,
        subordinates: [],
      };

      if (result.subordinates_id) {
        const subordinates = await this.getUser(
          result.subordinates_id,
          page,
          limit,
        );
        user.subordinates = subordinates;
      }

      const users = await this.getUser(null);
      return users.slice((page - 1) * limit, page * limit);
    }
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateBoss(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subordinates'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const newBoss = await this.userRepository.findOne({
      where: { id: updateUserDto.newBossId },
    });

    if (newBoss.role === 'user') {
      throw new HttpException('Users cannot be boss', HttpStatus.BAD_REQUEST);
    }

    if (!newBoss) {
      throw new NotFoundException(
        `New boss with id ${updateUserDto.newBossId} not found`,
      );
    }

    user.bossId = newBoss;
    return this.userRepository.save(user);
  }
}
