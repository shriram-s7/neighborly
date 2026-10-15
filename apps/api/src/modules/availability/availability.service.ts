import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AvailabilitySlotInput {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderSlots(providerId: string) {
    return this.prisma.availabilitySlot.findMany({
      where: { providerId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateSlots(providerId: string, slots: AvailabilitySlotInput[]) {
    // Validate slots
    for (const s of slots) {
      if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
        throw new BadRequestException('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
      }
      if (!s.startTime || !s.endTime || s.startTime >= s.endTime) {
        throw new BadRequestException(`Invalid time range: ${s.startTime} - ${s.endTime}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete existing slots
      await tx.availabilitySlot.deleteMany({
        where: { providerId },
      });

      // Insert new slots
      if (slots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: slots.map((s) => ({
            providerId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }

      return tx.availabilitySlot.findMany({
        where: { providerId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }
}
