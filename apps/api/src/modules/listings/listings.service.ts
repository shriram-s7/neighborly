import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto, haversineDistanceKm } from '@neighborly/shared';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    categoryId?: string;
    neighborhoodId?: string;
    search?: string;
    barterOnly?: boolean;
    lat?: number;
    lng?: number;
    sortBy?: 'distance' | 'trustScore' | 'priceAsc' | 'priceDesc' | 'rating';
  }) {
    // Determine reference coordinates (from query coords or neighborhood center)
    let refLat = query.lat;
    let refLng = query.lng;

    if ((refLat === undefined || refLng === undefined) && query.neighborhoodId) {
      const neighborhood = await this.prisma.neighborhood.findUnique({
        where: { id: query.neighborhoodId },
      });
      if (neighborhood) {
        refLat = neighborhood.centerLat;
        refLng = neighborhood.centerLng;
      }
    }

    // Default to Ramapuram center if no coordinates known
    if (refLat === undefined || refLng === undefined) {
      refLat = 13.0315;
      refLng = 80.1817;
    }

    // Fetch active listings with provider and category details
    const listings = await this.prisma.serviceListing.findMany({
      where: {
        isActive: true,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.barterOnly ? { acceptsBarter: true } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verificationLevel: true,
            neighborhoodId: true,
            lat: true,
            lng: true,
            neighborhood: {
              select: { id: true, name: true, city: true, centerLat: true, centerLng: true },
            },
            providerProfile: {
              select: {
                headline: true,
                yearsExperience: true,
                serviceRadiusKm: true,
                trustScore: true,
                trustBreakdown: true,
                completionRate: true,
                avgResponseMins: true,
                onTimeRate: true,
              },
            },
            availabilitySlots: {
              select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
            },
            _count: {
              select: {
                providedBookings: { where: { status: 'COMPLETED' } },
                reviewsReceived: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    // Compute distance and filter by provider radius
    const enriched = listings.map((l) => {
      const pLat = l.provider.lat ?? l.provider.neighborhood?.centerLat ?? 13.0315;
      const pLng = l.provider.lng ?? l.provider.neighborhood?.centerLng ?? 80.1817;
      const distanceKm = haversineDistanceKm(refLat!, refLng!, pLat, pLng);
      const serviceRadius = l.provider.providerProfile?.serviceRadiusKm ?? 5.0;
      const isWithinRadius = distanceKm <= serviceRadius;

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        pricingType: l.pricingType,
        price: l.price,
        acceptsBarter: l.acceptsBarter,
        isActive: l.isActive,
        createdAt: l.createdAt,
        category: l.category,
        provider: {
          id: l.provider.id,
          name: l.provider.name,
          avatarUrl: l.provider.avatarUrl,
          verificationLevel: l.provider.verificationLevel,
          neighborhoodName: l.provider.neighborhood?.name || 'Chennai',
          headline: l.provider.providerProfile?.headline || 'Community Provider',
          yearsExperience: l.provider.providerProfile?.yearsExperience ?? 0,
          serviceRadiusKm: serviceRadius,
          trustScore: l.provider.providerProfile?.trustScore ?? 30,
          trustBreakdown: l.provider.providerProfile?.trustBreakdown,
          completionRate: l.provider.providerProfile?.completionRate ?? 0,
          avgResponseMins: l.provider.providerProfile?.avgResponseMins ?? 0,
          onTimeRate: l.provider.providerProfile?.onTimeRate ?? 0,
          lat: pLat,
          lng: pLng,
          slotsCount: l.provider.availabilitySlots.length,
          completedJobsCount: l.provider._count.providedBookings,
          reviewsCount: l.provider._count.reviewsReceived,
        },
        distanceKm,
        isWithinRadius,
      };
    });

    // Apply sorting
    const sortBy = query.sortBy || 'distance';
    enriched.sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'trustScore') return b.provider.trustScore - a.provider.trustScore;
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      return 0;
    });

    return enriched;
  }

  async findOne(id: string) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id },
      include: {
        category: true,
        provider: {
          include: {
            neighborhood: true,
            providerProfile: true,
            availabilitySlots: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            reviewsReceived: {
              take: 5,
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
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Service listing not found');
    }

    return listing;
  }

  async findMyListings(providerId: string) {
    return this.prisma.serviceListing.findMany({
      where: { providerId },
      include: {
        category: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(providerId: string, dto: CreateListingDto) {
    // Verify provider profile exists
    const user = await this.prisma.user.findUnique({
      where: { id: providerId },
      include: { providerProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isProvider) {
      // Auto-enable provider mode if not yet enabled
      await this.prisma.user.update({
        where: { id: providerId },
        data: { isProvider: true },
      });
      if (!user.providerProfile) {
        await this.prisma.providerProfile.create({
          data: {
            userId: providerId,
            headline: 'Community Service Provider',
            trustScore: 30,
          },
        });
      }
    }

    const listing = await this.prisma.serviceListing.create({
      data: {
        providerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        pricingType: dto.pricingType,
        price: dto.price,
        acceptsBarter: dto.acceptsBarter ?? false,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: providerId,
        action: 'LISTING_CREATED',
        entityType: 'ServiceListing',
        entityId: listing.id,
        metadata: { title: listing.title, price: listing.price },
      },
    });

    return listing;
  }

  async update(providerId: string, id: string, dto: Partial<CreateListingDto>) {
    const existing = await this.prisma.serviceListing.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    if (existing.providerId !== providerId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return this.prisma.serviceListing.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.pricingType ? { pricingType: dto.pricingType } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.acceptsBarter !== undefined ? { acceptsBarter: dto.acceptsBarter } : {}),
      },
      include: { category: true },
    });
  }

  async toggleActive(providerId: string, id: string, isActive: boolean) {
    const existing = await this.prisma.serviceListing.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    if (existing.providerId !== providerId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return this.prisma.serviceListing.update({
      where: { id },
      data: { isActive },
      include: { category: true },
    });
  }
}
