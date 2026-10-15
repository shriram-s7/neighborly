import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        neighborhood: true,
        providerProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; bio?: string; neighborhoodId?: string; lat?: number; lng?: number }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        neighborhoodId: data.neighborhoodId,
        lat: data.lat,
        lng: data.lng,
      },
      include: {
        neighborhood: true,
        providerProfile: true,
      },
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async toggleProviderMode(userId: string, isProvider: boolean) {
    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isProvider },
      });

      if (isProvider) {
        const existingProfile = await tx.providerProfile.findUnique({
          where: { userId },
        });

        if (!existingProfile) {
          await tx.providerProfile.create({
            data: {
              userId,
              headline: 'Community Service Provider',
              serviceRadiusKm: 5.0,
              trustScore: 30,
              trustBreakdown: {
                verificationPoints: 0,
                ratingPoints: 15,
                completionPoints: 10,
                reliabilityPoints: 5,
                tenurePoints: 0,
                authenticityPoints: 0,
                penalties: 0,
                totalScore: 30,
                tier: 'New',
                tips: ['Complete phone verification for +8 points'],
              },
            },
          });
        }
      }

      return updatedUser;
    });

    return this.getProfile(user.id);
  }

  async updateVerificationLevel(userId: string, level: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { verificationLevel: level },
      include: {
        neighborhood: true,
        providerProfile: true,
      },
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async listUsers(role?: string) {
    const users = await this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isProvider: true,
        verificationLevel: true,
        joinedAt: true,
        neighborhood: { select: { id: true, name: true } },
        providerProfile: { select: { trustScore: true, headline: true } },
      },
    });

    return users;
  }
}
