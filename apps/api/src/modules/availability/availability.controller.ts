import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService, AvailabilitySlotInput } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@neighborly/shared';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get weekly availability slots for a provider' })
  async getProviderSlots(@Param('providerId') providerId: string) {
    return this.availabilityService.getProviderSlots(providerId);
  }

  @Get('my-slots')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current provider weekly availability slots' })
  async getMySlots(@CurrentUser() user: JwtPayload) {
    return this.availabilityService.getProviderSlots(user.sub);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update weekly availability slots in batch' })
  async updateSlots(
    @CurrentUser() user: JwtPayload,
    @Body() body: { slots: AvailabilitySlotInput[] },
  ) {
    return this.availabilityService.updateSlots(user.sub, body.slots);
  }
}
