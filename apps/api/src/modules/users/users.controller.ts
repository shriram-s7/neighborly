import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, Role, VerificationLevel } from '@neighborly/shared';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get full current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile info' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: { name?: string; phone?: string; bio?: string; neighborhoodId?: string; lat?: number; lng?: number },
  ) {
    return this.usersService.updateProfile(user.sub, data);
  }

  @Patch('toggle-provider')
  @ApiOperation({ summary: 'Toggle between requester and provider mode' })
  async toggleProvider(
    @CurrentUser() user: JwtPayload,
    @Body() body: { isProvider: boolean },
  ) {
    return this.usersService.toggleProviderMode(user.sub, body.isProvider);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users for administration' })
  async listUsers() {
    return this.usersService.listUsers();
  }

  @Patch('admin/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Upgrade verification level of a user' })
  async updateVerification(
    @Param('id') id: string,
    @Body() body: { level: VerificationLevel },
  ) {
    return this.usersService.updateVerificationLevel(id, body.level);
  }
}
