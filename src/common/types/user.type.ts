import { UserEntity } from 'src/users/entities/user.entity';

export type UserType = Omit<UserEntity, 'hasPassword'>;
