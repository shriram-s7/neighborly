import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, JwtPayload, UserSummary, Role, VerificationLevel } from '@neighborly/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user, wallet, and optionally provider profile inside a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone || null,
          passwordHash,
          role: dto.role || Role.USER,
          isProvider: dto.isProvider || false,
          neighborhoodId: dto.neighborhoodId || null,
          lat: dto.lat || null,
          lng: dto.lng || null,
          bio: dto.bio || null,
          verificationLevel: VerificationLevel.NONE,
        },
      });

      // Initialize Wallet with 0 balance
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          heldBalance: 0,
          credits: 0,
        },
      });

      // If user signed up as provider, initialize ProviderProfile
      if (dto.isProvider) {
        await tx.providerProfile.create({
          data: {
            userId: newUser.id,
            headline: 'Community Service Provider',
            serviceRadiusKm: 5.0,
            trustScore: 30, // Starting baseline
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

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: newUser.id,
          metadata: { email: newUser.email, role: newUser.role, isProvider: newUser.isProvider },
        },
      });

      return newUser;
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      isProvider: user.isProvider,
      name: user.name,
    });

    const userSummary = await this.getMe(user.id);
    return { ...tokens, user: userSummary };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        neighborhood: true,
        providerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Your account has been suspended by an administrator');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      isProvider: user.isProvider,
      name: user.name,
    });

    const userSummary = await this.getMe(user.id);
    return { ...tokens, user: userSummary };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.isSuspended) {
        throw new UnauthorizedException('User is inactive or suspended');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role as Role,
        isProvider: user.isProvider,
        name: user.name,
      });

      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        neighborhood: true,
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isProvider: user.isProvider,
      neighborhoodId: user.neighborhoodId,
      neighborhoodName: user.neighborhood?.name || null,
      lat: user.lat,
      lng: user.lng,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      verificationLevel: user.verificationLevel as VerificationLevel,
      trustScore: user.providerProfile?.trustScore ?? undefined,
      joinedAt: user.joinedAt.toISOString(),
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }
}
