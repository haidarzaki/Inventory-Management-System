import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(site?: string) {
    const uniqueWhere: Record<string, unknown> = {};
    const consumableWhere: Record<string, unknown> = {};
    if (site && site !== 'all') {
      uniqueWhere.site = site;
      consumableWhere.site = site;
    }

    const [uniqueAssets, consumableAssets, recentLogs] = await Promise.all([
      this.prisma.uniqueAsset.findMany({ where: uniqueWhere, select: { status: true } }),
      this.prisma.consumableAsset.findMany({ where: consumableWhere, select: { quantity: true, minStock: true } }),
      this.prisma.logEntry.findMany({ orderBy: { timestamp: 'desc' }, take: 8 }),
    ]);

    const totalUnique = uniqueAssets.filter((a) => a.status !== 'retired').length;
    const availableUnique = uniqueAssets.filter((a) => a.status === 'available').length;
    const borrowedUnique = uniqueAssets.filter((a) => a.status === 'borrowed').length;
    const lowStock = consumableAssets.filter((a) => a.quantity <= a.minStock).length;
    const totalConsumable = consumableAssets.length;

    return {
      totalUnique,
      availableUnique,
      borrowedUnique,
      lowStock,
      totalConsumable,
      recentLogs,
    };
  }
}
