import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { ExpressRequestInterfase } from 'src/common/types/expressRequest.interface';
import { UserResponseInterface } from 'src/common/types/userResponse.interface';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/roles/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
@Controller()
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  @Get('currentUser')
  async currentUser(
    @Req() request: ExpressRequestInterfase,
  ): Promise<UserResponseInterface> {
    return this.authService.buildUserResponse(request.user);
  }
  @Get('users')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard)
  async getAll() {
    return this.usersService.findAll();
  }

  @Get('user')
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard)
  async getUsers(@User('id') userId) {
    return this.usersService.findBossAndSubordinates(userId);
  }

  @Patch('user')
  @UseGuards(AuthGuard)
  updateBoss(@User('id') userId, @Body('newBossId') newBossId: number) {
    return this.usersService.updateBoss(userId, newBossId);
  }
}
