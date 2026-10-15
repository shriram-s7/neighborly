import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerEntryType } from '@neighborly/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            booking: {
              select: { id: true, agreedPrice: true, status: true },
            },
          },
        },
      },
    });

    if (!wallet) {
      // Auto-create wallet if missing
      await this.prisma.wallet.create({
        data: { userId, balance: 0, heldBalance: 0, credits: 0 },
      });
      return this.getWallet(userId);
    }

    return wallet;
  }

  async topup(userId: string, amountPaise: number) {
    if (amountPaise <= 0) {
      throw new BadRequestException('Top-up amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0, heldBalance: 0, credits: 0 },
        });
      }

      const newBalance = wallet.balance + amountPaise;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.TOPUP,
          amount: amountPaise,
          balanceAfter: newBalance,
          description: `Demo wallet top-up of ₹${amountPaise / 100}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'WALLET_TOPUP',
          entityType: 'Wallet',
          entityId: wallet.id,
          metadata: { amountPaise, balanceAfter: newBalance },
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Internal transactional escrow hold during booking creation.
   */
  async holdEscrowTx(
    tx: Prisma.TransactionClient,
    requesterId: string,
    bookingId: string,
    agreedPrice: number,
  ) {
    let wallet = await tx.wallet.findUnique({ where: { userId: requesterId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: requesterId, balance: 0, heldBalance: 0, credits: 0 },
      });
    }

    if (wallet.balance < agreedPrice) {
      throw new BadRequestException(
        `Insufficient wallet balance (₹${wallet.balance / 100}). Required ₹${agreedPrice / 100}. Please top up your wallet.`,
      );
    }

    const newBalance = wallet.balance - agreedPrice;
    const newHeld = wallet.heldBalance + agreedPrice;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        heldBalance: newHeld,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        bookingId,
        type: LedgerEntryType.ESCROW_HOLD,
        amount: agreedPrice,
        balanceAfter: newBalance,
        description: `Escrow hold for booking #${bookingId.slice(-6)}`,
      },
    });
  }

  /**
   * Internal transactional escrow refund (cancellation / dispute refund).
   */
  async refundEscrowTx(
    tx: Prisma.TransactionClient,
    requesterId: string,
    bookingId: string,
    amount: number,
    reason: string,
  ) {
    const wallet = await tx.wallet.findUnique({ where: { userId: requesterId } });
    if (!wallet) throw new NotFoundException('Requester wallet not found');

    const newHeld = Math.max(0, wallet.heldBalance - amount);
    const newBalance = wallet.balance + amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        heldBalance: newHeld,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        bookingId,
        type: LedgerEntryType.REFUND,
        amount,
        balanceAfter: newBalance,
        description: `Escrow refund: ${reason}`,
      },
    });
  }

  /**
   * Internal transactional escrow release to provider (minus 5% platform fee).
   */
  async releaseEscrowTx(
    tx: Prisma.TransactionClient,
    requesterId: string,
    providerId: string,
    bookingId: string,
    amount: number,
  ) {
    const requesterWallet = await tx.wallet.findUnique({ where: { userId: requesterId } });
    let providerWallet = await tx.wallet.findUnique({ where: { userId: providerId } });

    if (!requesterWallet) throw new NotFoundException('Requester wallet not found');
    if (!providerWallet) {
      providerWallet = await tx.wallet.create({
        data: { userId: providerId, balance: 0, heldBalance: 0, credits: 0 },
      });
    }

    // 5% platform fee
    const platformFee = Math.round(amount * 0.05);
    const providerPayout = amount - platformFee;

    // 1. Release from requester held balance
    const reqHeldAfter = Math.max(0, requesterWallet.heldBalance - amount);
    await tx.wallet.update({
      where: { id: requesterWallet.id },
      data: { heldBalance: reqHeldAfter },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: requesterWallet.id,
        bookingId,
        type: LedgerEntryType.ESCROW_RELEASE,
        amount,
        balanceAfter: requesterWallet.balance,
        description: `Escrow released for completed job #${bookingId.slice(-6)}`,
      },
    });

    // 2. Credit provider earnings
    const provBalanceAfter = providerWallet.balance + providerPayout;
    await tx.wallet.update({
      where: { id: providerWallet.id },
      data: { balance: provBalanceAfter },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: providerWallet.id,
        bookingId,
        type: LedgerEntryType.TOPUP,
        amount: providerPayout,
        balanceAfter: provBalanceAfter,
        description: `Job payout for #${bookingId.slice(-6)} (net 95%)`,
      },
    });

    // 3. Record platform fee ledger entry
    await tx.ledgerEntry.create({
      data: {
        walletId: providerWallet.id,
        bookingId,
        type: LedgerEntryType.PLATFORM_FEE,
        amount: platformFee,
        balanceAfter: provBalanceAfter,
        description: `5% Neighborly platform facilitation fee`,
      },
    });
  }

  /**
   * Internal transactional escrow split resolution for disputes.
   * Maintains invariant: requesterRefund + providerPayout + platformFee == totalAmount.
   */
  async splitEscrowTx(
    tx: Prisma.TransactionClient,
    requesterId: string,
    providerId: string,
    bookingId: string,
    totalAmount: number,
    requesterPercent: number,
  ) {
    const requesterWallet = await tx.wallet.findUnique({ where: { userId: requesterId } });
    let providerWallet = await tx.wallet.findUnique({ where: { userId: providerId } });

    if (!requesterWallet) throw new NotFoundException('Requester wallet not found');
    if (!providerWallet) {
      providerWallet = await tx.wallet.create({
        data: { userId: providerId, balance: 0, heldBalance: 0, credits: 0 },
      });
    }

    const requesterRefund = Math.floor((totalAmount * requesterPercent) / 100);
    const providerGross = totalAmount - requesterRefund;
    const platformFee = Math.round(providerGross * 0.05);
    const providerPayout = providerGross - platformFee;

    // 1. Update Requester Wallet
    const reqHeldAfter = Math.max(0, requesterWallet.heldBalance - totalAmount);
    const reqBalAfter = requesterWallet.balance + requesterRefund;
    await tx.wallet.update({
      where: { id: requesterWallet.id },
      data: { heldBalance: reqHeldAfter, balance: reqBalAfter },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: requesterWallet.id,
        bookingId,
        type: LedgerEntryType.REFUND,
        amount: requesterRefund,
        balanceAfter: reqBalAfter,
        description: `Dispute split settlement: ${requesterPercent}% refunded to resident`,
      },
    });

    // 2. Update Provider Wallet
    const provBalAfter = providerWallet.balance + providerPayout;
    await tx.wallet.update({
      where: { id: providerWallet.id },
      data: { balance: provBalAfter },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: providerWallet.id,
        bookingId,
        type: LedgerEntryType.TOPUP,
        amount: providerPayout,
        balanceAfter: provBalAfter,
        description: `Dispute split settlement: ${100 - requesterPercent}% paid to provider (net of 5% fee)`,
      },
    });

    // 3. Platform Fee
    if (platformFee > 0) {
      await tx.ledgerEntry.create({
        data: {
          walletId: providerWallet.id,
          bookingId,
          type: LedgerEntryType.PLATFORM_FEE,
          amount: platformFee,
          balanceAfter: provBalAfter,
          description: `Platform fee on dispute settlement`,
        },
      });
    }
  }

  /**
   * Internal transactional community credits award (free help, barter completion).
   */
  async awardCommunityCreditsTx(
    tx: Prisma.TransactionClient,
    userId: string,
    credits: number,
    reason: string,
  ) {
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId, balance: 0, heldBalance: 0, credits: 0 },
      });
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { credits: wallet.credits + credits },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: LedgerEntryType.CREDIT_EARN,
        amount: credits,
        balanceAfter: wallet.balance,
        description: `Community credits earned: ${reason}`,
      },
    });

    return updated;
  }

  /**
   * Invariant verification:
   * sum of all wallet balances + held balances + platform fees = sum of all top-ups.
   */
  async verifyLedger() {
    const wallets = await this.prisma.wallet.findMany();
    const totalBalances = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalHeld = wallets.reduce((sum, w) => sum + w.heldBalance, 0);

    const platformFeeEntries = await this.prisma.ledgerEntry.findMany({
      where: { type: LedgerEntryType.PLATFORM_FEE },
    });
    const totalPlatformFees = platformFeeEntries.reduce((sum, e) => sum + e.amount, 0);

    // Initial manual top-ups have bookingId == null and type == TOPUP
    const topupEntries = await this.prisma.ledgerEntry.findMany({
      where: { type: LedgerEntryType.TOPUP, bookingId: null },
    });
    const totalTopups = topupEntries.reduce((sum, e) => sum + e.amount, 0);

    const delta = totalBalances + totalHeld + totalPlatformFees - totalTopups;
    const isValid = delta === 0;

    return {
      isValid,
      totalBalances,
      totalHeld,
      totalPlatformFees,
      totalTopups,
      delta,
      formula: 'sum(balances + heldBalances + platformFees) == sum(top-ups)',
      verifiedAt: new Date().toISOString(),
    };
  }
}
