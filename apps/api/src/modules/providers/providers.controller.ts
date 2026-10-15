import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@neighborly/shared';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get public provider profile with listings and reviews' })
  async getPublicProfile(@Param('id') id: string) {
    return this.providersService.getPublicProfile(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update provider headline and service radius' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      headline?: string;
      yearsExperience?: number;
      serviceRadiusKm?: number;
    },
  ) {
    return this.providersService.updateProfile(user.sub, body);
  }
}
