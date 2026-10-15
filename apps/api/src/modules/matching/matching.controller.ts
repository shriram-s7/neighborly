import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { ParseRequestDto, RequestUrgency } from '@neighborly/shared';

@ApiTags('Matching & Community Intelligence')
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('parse')
  @ApiOperation({ summary: 'Parse natural language request into structured chips' })
  async parseRequest(@Body() dto: ParseRequestDto) {
    return this.matchingService.parseRequest(dto.text);
  }

  @Post('search')
  @ApiOperation({ summary: 'Run 6-factor explainable matching engine' })
  async findMatches(
    @Body()
    body: {
      categoryId?: string;
      requesterLat?: number;
      requesterLng?: number;
      budgetMax?: number;
      urgency?: RequestUrgency;
      isUrgentMode?: boolean;
      neighborhoodId?: string;
    },
  ) {
    return this.matchingService.findMatches(body);
  }

  @Get('pricing-estimate')
  @ApiOperation({ summary: 'Calculate fair-price estimate (Median, P25, P75) from completed bookings' })
  async getFairPriceEstimate(
    @Query('categoryId') categoryId: string,
    @Query('neighborhoodId') neighborhoodId?: string,
  ) {
    return this.matchingService.getFairPriceEstimate(categoryId, neighborhoodId);
  }
}
