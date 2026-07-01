import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateLogInput {
  type: 'borrow' | 'return' | 'stock-in' | 'stock-out';
  assetKind: 'unique' | 'consumable';
  assetId: string;
  assetName: string;
  serial?: string;
  quantity?: number;
  note?: string;
  userId: string;
  userName: string;
}

export interface FindLogsQuery {
  type?: string;
  assetKind?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  create(input: CreateLogInput) {
    return this.prisma.logEntry.create({ data: input });
  }

  async findAll(query: FindLogsQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 50;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.assetKind) where.assetKind = query.assetKind;
    if (query.search) {
      where.OR = [
        { assetName: { contains: query.search, mode: 'insensitive' } },
        { userName: { contains: query.search, mode: 'insensitive' } },
        { type: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
