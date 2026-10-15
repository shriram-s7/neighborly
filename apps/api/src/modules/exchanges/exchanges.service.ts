import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  ProposeExchangeDto,
  SkillExchangeStatus,
} from '@neighborly/shared';

@Injectable()
export class ExchangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getBarterListings(neighborhoodId?: string, categoryId?: string) {
    return this.prisma.serviceListing.findMany({
      where: {
        isActive: true,
        acceptsBarter: true,
        ...(categoryId ? { categoryId } : {}),
        ...(neighborhoodId ? { provider: { neighborhoodId } } : {}),
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            neighborhood: true,
            providerProfile: true,
            verificationLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async proposeExchange(proposerId: string, dto: ProposeExchangeDto) {
    if (proposerId === dto.receiverId) {
      throw new BadRequestException('You cannot propose a barter exchange with yourself');
    }

    const offeredListing = await this.prisma.serviceListing.findUnique({
      where: { id: dto.offeredListingId },
    });

    if (!offeredListing || offeredListing.providerId !== proposerId) {
      throw new BadRequestException('The offered listing must belong to you');
    }

    const requestedListing = await this.prisma.serviceListing.findUnique({
      where: { id: dto.requestedListingId },
      include: { provider: true },
    });

    if (!requestedListing || requestedListing.providerId !== dto.receiverId) {
      throw new BadRequestException('The requested listing is not valid for this provider');
    }

    if (!offeredListing.acceptsBarter || !requestedListing.acceptsBarter) {
      throw new BadRequestException('Both listings must have barter exchange enabled');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create skill exchange
      const exchange = await tx.skillExchange.create({
        data: {
          proposerId,
          receiverId: dto.receiverId,
          offeredListingId: dto.offeredListingId,
          requestedListingId: dto.requestedListingId,
          offeredHours: dto.offeredHours,
          requestedHours: dto.requestedHours,
          status: SkillExchangeStatus.PROPOSED,
        },
        include: {
          proposer: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
          offeredListing: { select: { id: true, title: true, price: true } },
          requestedListing: { select: { id: true, title: true, price: true } },
        },
      });

      // 2. Create chat conversation for this exchange
      await tx.conversation.create({
        data: {
          skillExchangeId: exchange.id,
        },
      });

      // 3. Notify receiver
      await this.notificationsService.create({
        userId: dto.receiverId,
        type: 'BARTER_PROPOSED',
        title: 'New Skill Exchange Proposal!',
        body: `${exchange.proposer.name} proposed swapping ${dto.offeredHours}h of "${offeredListing.title}" for ${dto.requestedHours}h of "${requestedListing.title}".`,
        link: '/barter',
      });

      return exchange;
    });
  }

  async getMyExchanges(userId: string) {
    return this.prisma.skillExchange.findMany({
      where: {
        OR: [{ proposerId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            neighborhood: true,
            providerProfile: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            neighborhood: true,
            providerProfile: true,
          },
        },
        offeredListing: { include: { category: true } },
        requestedListing: { include: { category: true } },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async respondExchange(userId: string, exchangeId: string, accept: boolean) {
    const exchange = await this.prisma.skillExchange.findUnique({
      where: { id: exchangeId },
      include: {
        offeredListing: true,
        requestedListing: true,
        proposer: true,
      },
    });

    if (!exchange) {
      throw new NotFoundException('Skill exchange not found');
    }

    if (exchange.receiverId !== userId) {
      throw new ForbiddenException('Only the receiving party can accept or decline this proposal');
    }

    if (exchange.status !== SkillExchangeStatus.PROPOSED) {
      throw new BadRequestException(`Cannot respond to exchange in ${exchange.status} status`);
    }

    const nextStatus = accept ? SkillExchangeStatus.ACCEPTED : SkillExchangeStatus.DECLINED;

    const updated = await this.prisma.skillExchange.update({
      where: { id: exchangeId },
      data: { status: nextStatus },
      include: {
        proposer: true,
        receiver: true,
      },
    });

    await this.notificationsService.create({
      userId: exchange.proposerId,
      type: 'BARTER_UPDATE',
      title: accept ? 'Skill Exchange Accepted! 🎉' : 'Skill Exchange Declined',
      body: accept
        ? `Your swap with ${updated.receiver.name} was accepted. You can now coordinate schedule via chat!`
        : `Your barter proposal was declined.`,
      link: '/barter',
    });

    return updated;
  }

  async confirmExchange(userId: string, exchangeId: string) {
    const exchange = await this.prisma.skillExchange.findUnique({
      where: { id: exchangeId },
      include: {
        proposer: true,
        receiver: true,
      },
    });

    if (!exchange) {
      throw new NotFoundException('Skill exchange not found');
    }

    if (exchange.proposerId !== userId && exchange.receiverId !== userId) {
      throw new ForbiddenException('You are not a participant in this skill exchange');
    }

    const isProposer = exchange.proposerId === userId;
    const proposerConfirmed = isProposer ? true : exchange.proposerConfirmed;
    const receiverConfirmed = !isProposer ? true : exchange.receiverConfirmed;

    const bothConfirmed = proposerConfirmed && receiverConfirmed;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.skillExchange.update({
        where: { id: exchangeId },
        data: {
          proposerConfirmed,
          receiverConfirmed,
          status: bothConfirmed ? SkillExchangeStatus.COMPLETED : exchange.status,
        },
      });

      // If both confirmed, award 5 Community Credits to BOTH participants!
      if (bothConfirmed) {
        await this.walletService.awardCommunityCreditsTx(
          tx,
          exchange.proposerId,
          5,
          `Completed skill swap with ${exchange.receiver.name}`,
        );

        await this.walletService.awardCommunityCreditsTx(
          tx,
          exchange.receiverId,
          5,
          `Completed skill swap with ${exchange.proposer.name}`,
        );

        await this.notificationsService.create({
          userId: exchange.proposerId,
          type: 'BARTER_COMPLETED',
          title: 'Skill Exchange Completed! 🌟',
          body: `Both parties confirmed. You earned +5 Community Credits!`,
          link: '/wallet',
        });

        await this.notificationsService.create({
          userId: exchange.receiverId,
          type: 'BARTER_COMPLETED',
          title: 'Skill Exchange Completed! 🌟',
          body: `Both parties confirmed. You earned +5 Community Credits!`,
          link: '/wallet',
        });
      }

      return updated;
    });
  }
}
