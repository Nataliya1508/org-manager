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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  @Get('currentUser')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  async currentUser(
    @Req() request: ExpressRequestInterfase,
  ): Promise<UserResponseInterface> {
    return this.authService.buildUserResponse(request.user);
  }
  @Get('users')
  @ApiOperation({ summary: 'Get all users (ONLY ADMIN)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard)
  async getAll() {
    return this.usersService.findAll();
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user and their subordinates or only user' })
  @ApiResponse({ status: 200, description: 'User and subordinates or user' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard)
  async getUsers(@User('id') userId) {
    return this.usersService.findBossAndSubordinates(userId);
  }

  @Patch('user')
  @ApiOperation({ summary: 'Update boss of a user' })
  @ApiResponse({
    status: 200,
    description: 'User information after updating boss',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  updateBoss(@User('id') userId, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateBoss(userId, updateUserDto);
  }
}
