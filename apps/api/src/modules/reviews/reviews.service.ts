import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BookingStatus,
  CreateReviewDto,
  TrustFactorBreakdown,
  VerificationLevel,
} from '@neighborly/shared';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        listing: true,
        requester: true,
        provider: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.requesterId !== reviewerId && booking.providerId !== reviewerId) {
      throw new ForbiddenException('Only parties involved in this booking can leave a review');
    }

    // Must be COMPLETED or PAID or REVIEWED
    const validStatuses = [BookingStatus.COMPLETED, BookingStatus.PAID, BookingStatus.REVIEWED];
    if (!validStatuses.includes(booking.status as BookingStatus)) {
      throw new BadRequestException('Reviews can only be submitted after the service has been completed');
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingReview) {
      throw new BadRequestException('A review has already been submitted for this booking');
    }

    const revieweeId = reviewerId === booking.requesterId ? booking.providerId : booking.requesterId;

    // Rule-based fake review / fraud detector
    const flagReasons: string[] = [];
    const now = new Date();

    // 1. Rapid completion (< 2 minutes between completion and 5-star review)
    if (booking.completedAt) {
      const minutesSinceCompletion = (now.getTime() - booking.completedAt.getTime()) / (1000 * 60);
      if (minutesSinceCompletion < 2 && dto.rating === 5) {
        flagReasons.push('Rapid completion (< 2 mins) with 5-star rating (potential collusion/self-review)');
      }
    }

    // 2. Suspiciously short text with extreme rating
    if (dto.comment.trim().length < 8 && (dto.rating === 5 || dto.rating === 1)) {
      flagReasons.push('Very short uninformative comment with extreme rating');
    }

    // 3. Reciprocal rapid review pattern (past 48h)
    const recentReciprocalReview = await this.prisma.review.findFirst({
      where: {
        reviewerId: revieweeId,
        revieweeId: reviewerId,
        createdAt: {
          gte: new Date(Date.now() - 48 * 3600 * 1000),
        },
      },
    });
    if (recentReciprocalReview) {
      flagReasons.push('Reciprocal review pattern detected within 48 hours');
    }

    const isFlagged = flagReasons.length > 0;

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId: dto.bookingId,
          reviewerId,
          revieweeId,
          rating: dto.rating,
          comment: dto.comment,
          isFlagged,
          flagReasons,
        },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          reviewee: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Advance booking to REVIEWED status
      if (booking.status !== BookingStatus.REVIEWED) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.REVIEWED },
        });

        await tx.bookingEvent.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: BookingStatus.REVIEWED,
            actorId: reviewerId,
            note: `Reviewed with ${dto.rating} stars${isFlagged ? ' (Flagged for moderation)' : ''}`,
          },
        });
      }

      return created;
    });

    // Recompute Trust Score for reviewee (if provider)
    await this.recalculateTrustScore(revieweeId);

    return review;
  }

  async getProviderReviews(providerId: string) {
    return this.prisma.review.findMany({
      where: { revieweeId: providerId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, name: true, avatarUrl: true, verificationLevel: true },
        },
      },
    });
  }

  async getFlaggedReviews() {
    return this.prisma.review.findMany({
      where: { isFlagged: true },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        reviewee: { select: { id: true, name: true, email: true } },
        booking: {
          select: {
            id: true,
            agreedPrice: true,
            status: true,
            completedAt: true,
            listing: { select: { title: true } },
          },
        },
      },
    });
  }

  async dismissFlag(reviewId: string) {
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isFlagged: false },
    });

    await this.recalculateTrustScore(review.revieweeId);
    return review;
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculateTrustScore(review.revieweeId);
    return { success: true, deletedId: reviewId };
  }

  /**
   * 6-FACTOR EXPLAINABLE TRUST SCORE FORMULA (0 - 100)
   * Factor 1: Verification Level (Max 20 pts)
   * Factor 2: Bayesian Rating (Max 25 pts)
   * Factor 3: Completion Rate (Max 20 pts)
   * Factor 4: Reliability & On-Time (Max 15 pts)
   * Factor 5: Volume & Community Tenure (Max 10 pts)
   * Factor 6: Review Authenticity (Max 10 pts)
   * Penalties: -10 per dispute, -5 per provider cancellation
   */
  async recalculateTrustScore(userId: string): Promise<TrustFactorBreakdown | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: true,
        reviewsReceived: true,
        providedBookings: true,
        disputesRaised: true,
      },
    });

    if (!user || !user.isProvider) {
      return null;
    }

    const tips: string[] = [];

    // Factor 1: Verification Level (Max 20)
    let verificationPoints = 0;
    if (user.verificationLevel === VerificationLevel.ADDRESS) {
      verificationPoints = 20;
    } else if (user.verificationLevel === VerificationLevel.ID) {
      verificationPoints = 15;
      tips.push('Submit address proof to earn +5 more verification points.');
    } else if (user.verificationLevel === VerificationLevel.PHONE) {
      verificationPoints = 5;
      tips.push('Upload Government ID verification to gain +10 trust points.');
    } else {
      verificationPoints = 0;
      tips.push('Verify your phone and ID to unlock up to +20 trust points.');
    }

    // Factor 2: Bayesian Rating (Max 25)
    // Formula: R_bayesian = (C * m + sum(r_i)) / (C + n)
    // with prior C = 3, prior mean m = 4.0
    const reviews = user.reviewsReceived;
    const validReviews = reviews.filter((r) => !r.isFlagged);
    const C = 3.0;
    const m = 4.0;
    const sumRatings = validReviews.reduce((sum, r) => sum + r.rating, 0);
    const n = validReviews.length;
    const bayesianRating = (C * m + sumRatings) / (C + n); // ranges ~ 1.0 to 5.0
    const ratingPoints = Math.round((bayesianRating / 5.0) * 25 * 10) / 10;

    if (n < 3) {
      tips.push(`Gather ${3 - n} more positive reviews to strengthen your Bayesian rating score.`);
    }

    // Factor 3: Completion Rate (Max 20)
    const bookings = user.providedBookings;
    const acceptedCount = bookings.filter((b) =>
      ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'REVIEWED', 'CANCELLED', 'DECLINED'].includes(
        b.status,
      ),
    ).length;
    const completedCount = bookings.filter((b) =>
      ['COMPLETED', 'PAID', 'REVIEWED'].includes(b.status),
    ).length;

    const completionRateVal = acceptedCount > 0 ? completedCount / acceptedCount : 1.0;
    const completionPoints = Math.round(completionRateVal * 20 * 10) / 10;

    // Factor 4: Reliability & On-Time (Max 15)
    // On-time rate tracked in provider profile or computed
    const onTimeRateVal = user.providerProfile?.onTimeRate ?? 0.95;
    const reliabilityPoints = Math.round(onTimeRateVal * 15 * 10) / 10;

    // Factor 5: Volume & Community Tenure (Max 10)
    const monthsTenure = Math.max(
      0.5,
      (Date.now() - user.joinedAt.getTime()) / (1000 * 3600 * 24 * 30),
    );
    const tenureScore = Math.min(10, completedCount * 1.5 + monthsTenure * 0.5);
    const tenurePoints = Math.round(tenureScore * 10) / 10;

    // Factor 6: Review Authenticity (Max 10)
    const flaggedCount = reviews.filter((r) => r.isFlagged).length;
    const authenticityRatio = reviews.length > 0 ? (reviews.length - flaggedCount) / reviews.length : 1.0;
    const authenticityPoints = Math.round(authenticityRatio * 10 * 10) / 10;

    if (flaggedCount > 0) {
      tips.push(`${flaggedCount} review(s) currently flagged for safety checks.`);
    }

    // Penalties
    // -10 per dispute upheld/raised against provider
    const disputesAgainst = await this.prisma.dispute.count({
      where: {
        booking: { providerId: userId },
      },
    });
    // -5 per cancellation initiated by provider
    const cancellations = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
    const penalties = disputesAgainst * 10 + cancellations * 5;

    // Total clamped between 0 and 100
    const rawTotal =
      verificationPoints +
      ratingPoints +
      completionPoints +
      reliabilityPoints +
      tenurePoints +
      authenticityPoints -
      penalties;
    const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal * 10) / 10));

    let tier: 'New' | 'Trusted' | 'Highly Trusted' | 'Pillar of the Community' = 'New';
    if (totalScore >= 85) {
      tier = 'Pillar of the Community';
    } else if (totalScore >= 70) {
      tier = 'Highly Trusted';
    } else if (totalScore >= 50) {
      tier = 'Trusted';
    }

    const breakdown: TrustFactorBreakdown = {
      verificationPoints,
      ratingPoints,
      completionPoints,
      reliabilityPoints,
      tenurePoints,
      authenticityPoints,
      penalties,
      totalScore,
      tier,
      tips,
    };

    // Update in database
    await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {
        trustScore: totalScore,
        trustBreakdown: breakdown as any,
        completionRate: Math.round(completionRateVal * 100),
      },
      create: {
        userId,
        headline: 'Community Service Provider',
        serviceRadiusKm: 5.0,
        trustScore: totalScore,
        trustBreakdown: breakdown as any,
        completionRate: Math.round(completionRateVal * 100),
      },
    });

    return breakdown;
  }
}
