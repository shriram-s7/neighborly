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
import { ReviewsService } from '../reviews/reviews.service';
import {
  BookingStatus,
  DisputeStatus,
  DisputeResolution,
  CreateDisputeDto,
  ResolveDisputeDto,
} from '@neighborly/shared';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
    private readonly reviewsService: ReviewsService,
  ) {}

  async createDispute(userId: string, dto: CreateDisputeDto) {
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

    if (booking.requesterId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('Only parties involved in this booking can raise a dispute');
    }

    const existingDispute = await this.prisma.dispute.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingDispute) {
      throw new BadRequestException('A dispute has already been filed for this booking');
    }

    // Must be in an active or completed state
    const disputableStatuses = [
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
      BookingStatus.SCHEDULED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.PAID,
    ];
    if (!disputableStatuses.includes(booking.status as BookingStatus)) {
      throw new BadRequestException(`Cannot dispute booking in ${booking.status} status`);
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      // 1. Create dispute record
      const created = await tx.dispute.create({
        data: {
          bookingId: dto.bookingId,
          raisedById: userId,
          reason: dto.reason,
          evidenceText: dto.evidenceText,
          status: DisputeStatus.OPEN,
        },
        include: {
          raisedBy: { select: { id: true, name: true, email: true } },
          booking: {
            include: {
              listing: { select: { title: true } },
              requester: { select: { id: true, name: true, email: true } },
              provider: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      // 2. Advance booking status to DISPUTED (escrow remains frozen)
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.DISPUTED },
      });

      // 3. Record BookingEvent
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.DISPUTED,
          actorId: userId,
          note: `Dispute raised: ${dto.reason}`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'DISPUTE_RAISED',
          entityType: 'Dispute',
          entityId: created.id,
          metadata: { bookingId: booking.id, reason: dto.reason },
        },
      });

      return created;
    });

    // Notify the other party
    const targetUserId = userId === booking.requesterId ? booking.providerId : booking.requesterId;
    await this.notificationsService.create({
      userId: targetUserId,
      type: 'DISPUTE_RAISED',
      title: 'Dispute Filed on Booking',
      body: `A dispute has been raised regarding "${booking.listing.title}". Escrow funds are frozen under mediation.`,
      link: `/bookings/${booking.id}`,
    });

    // Broadcast status change
    this.chatGateway.emitBookingUpdate(booking.id, {
      type: 'STATUS_CHANGE',
      from: booking.status,
      to: BookingStatus.DISPUTED,
    });

    return dispute;
  }

  async getAllDisputes(status?: DisputeStatus) {
    return this.prisma.dispute.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        booking: {
          include: {
            listing: { select: { id: true, title: true, price: true } },
            requester: { select: { id: true, name: true, email: true, phone: true } },
            provider: { select: { id: true, name: true, email: true, phone: true } },
            events: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
      },
    });
  }

  async getDispute(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        booking: {
          include: {
            listing: true,
            requester: true,
            provider: true,
            events: { orderBy: { createdAt: 'asc' } },
            ledgerEntries: { orderBy: { createdAt: 'desc' } },
            conversation: {
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                  include: { sender: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async resolveDispute(adminId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            requester: true,
            provider: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('This dispute has already been resolved');
    }

    const booking = dispute.booking;
    const splitPercent = dto.splitPercent || 50;

    const resolved = await this.prisma.$transaction(async (tx) => {
      let finalBookingStatus: BookingStatus = BookingStatus.PAID;

      // Settle Escrow based on resolution
      if (dto.resolution === DisputeResolution.REFUND) {
        // 100% back to requester
        await this.walletService.refundEscrowTx(
          tx,
          booking.requesterId,
          booking.id,
          booking.agreedPrice,
          `Dispute resolved in favor of resident: ${dto.adminNote}`,
        );
        finalBookingStatus = BookingStatus.REFUNDED;
      } else if (dto.resolution === DisputeResolution.RELEASE) {
        // 100% to provider (net of 5% fee)
        await this.walletService.releaseEscrowTx(
          tx,
          booking.requesterId,
          booking.providerId,
          booking.id,
          booking.agreedPrice,
        );
        finalBookingStatus = BookingStatus.PAID;
      } else if (dto.resolution === DisputeResolution.SPLIT) {
        // Split escrow by percentage
        await this.walletService.splitEscrowTx(
          tx,
          booking.requesterId,
          booking.providerId,
          booking.id,
          booking.agreedPrice,
          splitPercent,
        );
        finalBookingStatus = BookingStatus.PAID;
      }

      // Update Booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: finalBookingStatus },
      });

      // Update Dispute Record
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: dto.resolution,
          splitPercent: dto.resolution === DisputeResolution.SPLIT ? splitPercent : null,
          adminNote: dto.adminNote,
          resolvedById: adminId,
        },
      });

      // Record BookingEvent
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: BookingStatus.DISPUTED,
          toStatus: finalBookingStatus,
          actorId: adminId,
          note: `Dispute resolved by Admin (${dto.resolution}${
            dto.resolution === DisputeResolution.SPLIT ? ` ${splitPercent}/${100 - splitPercent}` : ''
          }): ${dto.adminNote}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'DISPUTE_RESOLVED',
          entityType: 'Dispute',
          entityId: disputeId,
          metadata: {
            resolution: dto.resolution,
            splitPercent,
            agreedPrice: booking.agreedPrice,
          },
        },
      });

      return updatedDispute;
    });

    // Recompute provider trust score
    await this.reviewsService.recalculateTrustScore(booking.providerId);

    // Notify both parties
    await this.notificationsService.create({
      userId: booking.requesterId,
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved by Community Admin',
      body: `Decision: ${dto.resolution}. ${dto.adminNote}`,
      link: `/bookings/${booking.id}`,
    });

    await this.notificationsService.create({
      userId: booking.providerId,
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved by Community Admin',
      body: `Decision: ${dto.resolution}. ${dto.adminNote}`,
      link: `/bookings/${booking.id}`,
    });

    // Realtime update
    this.chatGateway.emitBookingUpdate(booking.id, {
      type: 'STATUS_CHANGE',
      from: BookingStatus.DISPUTED,
      to: resolved.resolution === DisputeResolution.REFUND ? BookingStatus.REFUNDED : BookingStatus.PAID,
    });

    return resolved;
  }
}
