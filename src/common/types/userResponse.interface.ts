import { UserType } from './user.type';

export interface UserResponseInterface {
  user?: Omit<UserType, 'password'>;
  token: string;
}
