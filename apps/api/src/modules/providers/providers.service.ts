import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        verificationLevel: true,
        isProvider: true,
        neighborhoodId: true,
        lat: true,
        lng: true,
        joinedAt: true,
        neighborhood: {
          select: { id: true, name: true, city: true, centerLat: true, centerLng: true },
        },
        providerProfile: true,
        listings: {
          where: { isActive: true },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
        availabilitySlots: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: {
          select: {
            providedBookings: { where: { status: 'COMPLETED' } },
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user || !user.isProvider) {
      throw new NotFoundException('Provider profile not found');
    }

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      verificationLevel: user.verificationLevel,
      neighborhoodName: user.neighborhood?.name || 'Chennai',
      joinedAt: user.joinedAt.toISOString(),
      lat: user.lat,
      lng: user.lng,
      profile: user.providerProfile,
      listings: user.listings,
      availabilitySlots: user.availabilitySlots,
      recentReviews: user.reviewsReceived,
      stats: {
        completedJobs: user._count.providedBookings,
        reviewsCount: user._count.reviewsReceived,
        completionRate: user.providerProfile?.completionRate ?? 0,
        avgResponseMins: user.providerProfile?.avgResponseMins ?? 0,
        onTimeRate: user.providerProfile?.onTimeRate ?? 0,
        serviceRadiusKm: user.providerProfile?.serviceRadiusKm ?? 5.0,
      },
    };
  }

  async updateProfile(
    providerId: string,
    data: {
      headline?: string;
      yearsExperience?: number;
      serviceRadiusKm?: number;
    },
  ) {
    return this.prisma.providerProfile.upsert({
      where: { userId: providerId },
      update: {
        ...(data.headline ? { headline: data.headline } : {}),
        ...(data.yearsExperience !== undefined ? { yearsExperience: data.yearsExperience } : {}),
        ...(data.serviceRadiusKm !== undefined ? { serviceRadiusKm: data.serviceRadiusKm } : {}),
      },
      create: {
        userId: providerId,
        headline: data.headline || 'Community Service Provider',
        yearsExperience: data.yearsExperience || 0,
        serviceRadiusKm: data.serviceRadiusKm || 5.0,
        trustScore: 30,
      },
    });
  }
}
