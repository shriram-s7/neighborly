import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@neighborly/shared';

export function maskContactInfo(text: string): { maskedText: string; wasMasked: boolean } {
  const phoneRegex = /(\+?91[\-\s]?)?[6-9]\d{9}|\b\d{5}[\s\-]?\d{5}\b/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  let wasMasked = false;
  let masked = text.replace(phoneRegex, () => {
    wasMasked = true;
    return '[Phone hidden until accepted]';
  });
  masked = masked.replace(emailRegex, () => {
    wasMasked = true;
    return '[Email hidden until accepted]';
  });

  return { maskedText: masked, wasMasked };
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateBookingConversation(bookingId: string) {
    let conversation = await this.prisma.conversation.findUnique({
      where: { bookingId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { bookingId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      });
    }

    return conversation;
  }

  async sendMessage(senderId: string, conversationId: string, rawBody: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { booking: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if phone/email masking applies
    let body = rawBody;
    let wasMasked = false;

    if (conversation.booking) {
      // If booking is in REQUESTED state, apply safety contact masking
      if (conversation.booking.status === BookingStatus.REQUESTED) {
        const result = maskContactInfo(rawBody);
        body = result.maskedText;
        wasMasked = result.wasMasked;
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        body,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return { ...message, wasMasked };
  }
}
