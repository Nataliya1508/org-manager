import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/roles/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (user?.role === Role.Admin) {
      return true;
    }
    if (user?.role === Role.Boss) {
      return (
        requiredRoles.includes(Role.Boss) &&
        (user.id === requiredRoles[0] ||
          user.subordinates.includes(requiredRoles[0]))
      );
    }
    // return requiredRoles.some((role) => role === user?.role);
    return (
      user?.role === Role.User &&
      requiredRoles.includes(Role.User) &&
      user.id === requiredRoles[0]
    );
  }
}
