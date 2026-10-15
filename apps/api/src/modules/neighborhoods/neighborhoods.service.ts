import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NeighborhoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.neighborhood.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            requests: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.neighborhood.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            requests: true,
          },
        },
      },
    });
  }
}
