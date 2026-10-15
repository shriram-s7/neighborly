import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { Role } from '@neighborly/shared';

@ApiTags('Analytics & Health')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('community-health')
  @ApiOperation({ summary: 'Compute live Community Health Index per neighborhood' })
  async getCommunityHealth() {
    return this.analyticsService.getCommunityHealth();
  }

  @Get('service-gaps')
  @ApiOperation({ summary: 'Calculate unfulfilled demand vs local supply heatmap across Chennai' })
  async getServiceGaps() {
    return this.analyticsService.getServiceGaps();
  }
}
