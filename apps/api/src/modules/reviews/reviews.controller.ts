import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, Role } from '@neighborly/shared';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit review for completed service (with fraud detection)' })
  async createReview(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get reviews for a service provider' })
  async getProviderReviews(@Param('providerId') providerId: string) {
    return this.reviewsService.getProviderReviews(providerId);
  }

  @Get('trust-breakdown/:providerId')
  @ApiOperation({ summary: 'Get 6-factor explainable Bayesian trust breakdown for a provider' })
  async getTrustBreakdown(@Param('providerId') providerId: string) {
    return this.reviewsService.recalculateTrustScore(providerId);
  }

  @Get('admin/flagged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews flagged by fraud detection rules' })
  async getFlaggedReviews() {
    return this.reviewsService.getFlaggedReviews();
  }

  @Post('admin/:id/dismiss')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dismiss flag on review and recalculate trust score' })
  async dismissFlag(@Param('id') id: string) {
    return this.reviewsService.dismissFlag(id);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review and recalculate trust score' })
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
