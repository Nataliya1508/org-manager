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

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateBoss(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const { newBossId, subordinateId } = updateUserDto;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subordinates'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const newBoss = await this.userRepository.findOne({
      where: { id: newBossId },
    });

    if (!newBoss) {
      throw new NotFoundException(`New boss with id ${newBossId} not found`);
    }

    if (newBoss.role === 'user') {
      throw new HttpException('Users cannot be a boss', HttpStatus.BAD_REQUEST);
    }

    if (subordinateId) {
      const subordinateToUpdate = user.subordinates.find(
        (sub) => sub.id === subordinateId,
      );

      if (!subordinateToUpdate) {
        throw new NotFoundException(
          `Subordinate with id ${subordinateId} not found`,
        );
      }

      subordinateToUpdate.boss = newBoss;
    } else {
      user.boss = newBoss;
    }

    await this.userRepository.save(user.subordinates);

    return user;
  }

  async getUser(
    userId: number = null,
    page: number = 1,
    limit: number = 10,
    offset = (page - 1) * limit,
  ): Promise<UserEntity[]> {
    const recursiveCte = `
    WITH RECURSIVE user_hierarchy (id, name, email, boss, Level) AS (
      SELECT id, name, email, boss, 1 as Level
      FROM users
       WHERE id = $1
      UNION ALL
      SELECT u.id, u.name, u.email, u.boss, uh.Level + 1
      FROM users u
      INNER JOIN user_hierarchy uh ON u.boss = uh.id
    )
    SELECT * FROM user_hierarchy
    WHERE boss = $1 OR id = $1 


  `;
    const paginatedQuery = `
    SELECT * FROM (${recursiveCte}) as paginated_hierarchy
    OFFSET $2
    LIMIT $3
  `;

    const results = await this.userRepository.query(paginatedQuery, [
      userId,
      offset,
      limit,
    ]);

    const userMap = new Map();

    results.forEach((result) => {
      const { id, name, email, role, boss: bossId } = result;
      const user = {
        id,
        name,
        email,
        role,
        bossId,
        subordinates: [],
      };

      userMap.set(user.id, user);
    });

    const users = Array.from(userMap.values());

    users.forEach((user) => {
      if (user.bossId && userMap.has(user.bossId)) {
        const boss = userMap.get(user.bossId);
        boss.subordinates.push(user);
      }
    });

    return users;
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    offset = (page - 1) * limit,
  ): Promise<UserEntity[]> {
    const recursiveCte = `
    WITH RECURSIVE user_hierarchy (id, name, email, role, boss, Level) AS (
      SELECT
        id,
        name,
        email,
        role,
        boss,
        1 as Level
      FROM
        users
      UNION ALL
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.boss,
        uh.Level + 1
      FROM
        users u
      INNER JOIN
        user_hierarchy uh ON u.boss = uh.id
    )
    SELECT * FROM user_hierarchy
            OFFSET $1
    LIMIT $2
  `;

    const results = await this.userRepository.query(recursiveCte, [
      offset,
      limit,
    ]);

    const userMap = new Map();

    results.forEach((result) => {
      const { id, name, email, role, boss: bossId } = result;

      const user = {
        id,
        name,
        email,
        role,
        bossId,
        subordinates: [],
      };

      userMap.set(user.id, user);
    });

    const users = Array.from(userMap.values());

    users.forEach((user) => {
      if (user.bossId && userMap.has(user.bossId)) {
        const boss = userMap.get(user.bossId);
        boss.subordinates.push(user);
      }
    });

    return users;
  }
}
