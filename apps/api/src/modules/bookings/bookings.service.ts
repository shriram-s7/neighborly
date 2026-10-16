import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  BookingStatus,
  BookingPaymentMode,
  CreateBookingDto,
  TransitionBookingDto,
} from '@neighborly/shared';
import {
  validateBookingTransition,
  ActorRole,
} from './booking.state-machine';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createBooking(requesterId: string, dto: CreateBookingDto) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id: dto.listingId },
      include: { provider: true },
    });

    if (!listing || !listing.isActive) {
      throw new NotFoundException('Service listing is inactive or not found');
    }

    if (listing.providerId === requesterId) {
      throw new BadRequestException('You cannot book your own service listing');
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const agreedPrice = listing.price;
    // Request bodies are not validated at runtime, so apply the schema default here.
    // The stored mode decides later refunds/releases, so the hold must use the same value.
    const paymentMode = dto.paymentMode ?? BookingPaymentMode.WALLET;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create booking in REQUESTED state
      const booking = await tx.booking.create({
        data: {
          requestId: dto.requestId || null,
          listingId: listing.id,
          requesterId,
          providerId: listing.providerId,
          scheduledAt: scheduledDate,
          agreedPrice,
          paymentMode,
          status: BookingStatus.REQUESTED,
        },
      });

      // 2. If WALLET payment with agreedPrice > 0, hold escrow immediately
      if (paymentMode === BookingPaymentMode.WALLET && agreedPrice > 0) {
        await this.walletService.holdEscrowTx(tx, requesterId, booking.id, agreedPrice);
      }

      // 3. Write initial BookingEvent audit trail
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: null,
          toStatus: BookingStatus.REQUESTED,
          actorId: requesterId,
          note: 'Booking requested by resident with escrow hold',
        },
      });

      // 4. Create conversation room
      await tx.conversation.create({
        data: { bookingId: booking.id },
      });

      // 5. System Audit Log
      await tx.auditLog.create({
        data: {
          actorId: requesterId,
          action: 'BOOKING_CREATED',
          entityType: 'Booking',
          entityId: booking.id,
          metadata: { agreedPrice, paymentMode },
        },
      });

      // 6. Notify provider
      await this.notificationsService.create({
        userId: listing.providerId,
        type: 'BOOKING_REQUESTED',
        title: 'New Service Booking Request!',
        body: `A neighbor requested "${listing.title}" for ₹${agreedPrice / 100}. Escrow is secured.`,
        link: `/bookings/${booking.id}`,
      });

      this.chatGateway.emitBookingUpdate(booking.id, {
        type: 'STATUS_CHANGE',
        status: BookingStatus.REQUESTED,
      });

      return booking;
    });
  }

  async transitionBooking(
    userId: string,
    userRole: string,
    bookingId: string,
    dto: TransitionBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        requester: true,
        provider: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Determine actor role for state machine validation
    let actorRole: ActorRole = 'REQUESTER';
    if (userRole === 'ADMIN') {
      actorRole = 'ADMIN';
    } else if (userId === booking.providerId) {
      actorRole = 'PROVIDER';
    } else if (userId === booking.requesterId) {
      actorRole = 'REQUESTER';
    } else {
      throw new ForbiddenException('You are not authorized to transition this booking');
    }

    // Validate legal transition through pure state machine table
    const validation = validateBookingTransition(
      booking.status as unknown as BookingStatus,
      dto.to,
      actorRole,
    );
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Execute state transition & side effects in an atomic Prisma transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      let completedAt = booking.completedAt;
      let autoReleaseAt = booking.autoReleaseAt;

      // Side Effect: DECLINED / CANCELLED -> Full Escrow Refund
      if (dto.to === BookingStatus.DECLINED || dto.to === BookingStatus.CANCELLED) {
        if (booking.paymentMode === BookingPaymentMode.WALLET) {
          await this.walletService.refundEscrowTx(
            tx,
            booking.requesterId,
            booking.id,
            booking.agreedPrice,
            dto.cancelReason || `Booking ${dto.to.toLowerCase()}`,
          );
        }
      }

      // Side Effect: COMPLETED -> sets 48-hour auto-release countdown
      if (dto.to === BookingStatus.COMPLETED) {
        completedAt = new Date();
        autoReleaseAt = new Date(Date.now() + 48 * 3600 * 1000); // +48 hours
      }

      // Side Effect: PAID -> Releases escrow to provider (minus 5% platform fee)
      if (dto.to === BookingStatus.PAID) {
        if (booking.paymentMode === BookingPaymentMode.WALLET && booking.agreedPrice > 0) {
          await this.walletService.releaseEscrowTx(
            tx,
            booking.requesterId,
            booking.providerId,
            booking.id,
            booking.agreedPrice,
          );
        } else if (booking.agreedPrice === 0 || booking.paymentMode === BookingPaymentMode.FREE) {
          // Free help: helper earns 10 community credits!
          await this.walletService.awardCommunityCreditsTx(
            tx,
            booking.providerId,
            10,
            `Volunteer free help completed for #${booking.id.slice(-6)}`,
          );
        }
      }

      // Update Booking record
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: dto.to,
          cancelReason: dto.cancelReason || null,
          completedAt,
          autoReleaseAt,
        },
      });

      // Record BookingEvent audit trail
      await tx.bookingEvent.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: dto.to,
          actorId: userId,
          note: dto.note || `Transitioned to ${dto.to} by ${actorRole.toLowerCase()}`,
        },
      });

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'BOOKING_TRANSITION',
          entityType: 'Booking',
          entityId: bookingId,
          metadata: { from: booking.status, to: dto.to, actorRole },
        },
      });

      return updatedBooking;
    });

    // Notify the other party
    const targetUserId = userId === booking.requesterId ? booking.providerId : booking.requesterId;
    await this.notificationsService.create({
      userId: targetUserId,
      type: 'BOOKING_UPDATE',
      title: `Booking Status: ${dto.to}`,
      body: `Booking for "${booking.listing.title}" is now ${dto.to}.`,
      link: `/bookings/${booking.id}`,
    });

    // Real-time broadcast
    this.chatGateway.emitBookingUpdate(booking.id, {
      type: 'STATUS_CHANGE',
      from: booking.status,
      to: dto.to,
      booking: updated,
    });

    return this.getBooking(bookingId, userId);
  }

  async getBooking(id: string, userId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        listing: { include: { category: true } },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            neighborhood: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            neighborhood: true,
            providerProfile: true,
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
        conversation: true,
        review: true,
        dispute: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getMyBookings(userId: string, roleTab?: 'requester' | 'provider') {
    const isProviderTab = roleTab === 'provider';
    return this.prisma.booking.findMany({
      where: isProviderTab ? { providerId: userId } : { requesterId: userId },
      include: {
        listing: { include: { category: true } },
        requester: { select: { id: true, name: true, avatarUrl: true } },
        provider: { select: { id: true, name: true, avatarUrl: true, providerProfile: true } },
        review: true,
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cron job: auto-releases payments 48 hours after COMPLETED status.
   */
  @Cron('*/5 * * * *')
  async handleAutoReleaseCron() {
    this.logger.log('Checking for bookings eligible for 48-hour escrow auto-release...');
    const now = new Date();
    const eligibleBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        autoReleaseAt: { lte: now },
      },
    });

    for (const b of eligibleBookings) {
      try {
        await this.transitionBooking(b.requesterId, 'SYSTEM', b.id, {
          to: BookingStatus.PAID,
          note: 'Automatic escrow release after 48 hours completed',
        });
        this.logger.log(`Auto-released escrow for booking #${b.id}`);
      } catch (err: any) {
        this.logger.error(`Failed to auto-release booking #${b.id}: ${err.message}`);
      }
    }
  }

  /**
   * Fast-Forward Time Admin demo helper:
   * Immediately triggers auto-release for any pending completed bookings.
   */
  async fastForwardAutoRelease(adminId: string) {
    const completedBookings = await this.prisma.booking.findMany({
      where: { status: BookingStatus.COMPLETED },
    });

    const results = [];
    for (const b of completedBookings) {
      const res = await this.transitionBooking(adminId, 'ADMIN', b.id, {
        to: BookingStatus.PAID,
        note: 'Admin demo fast-forward auto-release triggered',
      });
      results.push(res.id);
    }

    return {
      success: true,
      releasedCount: results.length,
      releasedBookingIds: results,
      message: `Fast-forwarded 48 hours: released escrow for ${results.length} bookings to providers`,
    };
  }
}
