import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UsersService } from 'src/users/users.service';
import { ExpressRequestInterfase } from '../types/expressRequest.interface';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}
  async use(req: ExpressRequestInterfase, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();

      return;
    }
    const token = req.headers.authorization.split(' ')[1];
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const decode = verify(token, jwtSecret);

      const user = await this.usersService.findById(decode.id);
      req.user = user;
    } catch (err) {
      req.user = null;
      throw new BadRequestException('Invalid token');
    }

    next();
  }
 }