import { Request } from 'express';
import { UserEntity } from 'src/users/entities/user.entity';

export type ExpressRequestInterfase = Request & {
  user?: UserEntity;
};
