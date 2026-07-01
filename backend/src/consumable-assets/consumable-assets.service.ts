import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { CreateConsumableAssetDto } from './dto/create-consumable-asset.dto';
import { UpdateConsumableAssetDto } from './dto/update-consumable-asset.dto';
import { StockInDto, StockOutDto } from './dto/stock.dto';
import { AuthUser } from '../auth/strategies/jwt.strategy';

export interface FindConsumableAssetsQuery {
  site?: string;
  category?: string;
  search?: string;
  lowStockOnly?: boolean;
}

@Injectable()
export class ConsumableAssetsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async findAll(query: FindConsumableAssetsQuery) {
    const where: Record<string, unknown> = {};
    if (query.site && query.site !== 'all') where.site = query.site;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const assets = await this.prisma.consumableAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (query.lowStockOnly) {
      return assets.filter((a) => a.quantity <= a.minStock);
    }
    return assets;
  }

  async findOne(id: string) {
    const asset = await this.prisma.consumableAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Item tidak ditemukan');
    return asset;
  }

  async create(dto: CreateConsumableAssetDto, actor: AuthUser) {
    const asset = await this.prisma.consumableAsset.create({ data: dto });

    await this.logsService.create({
      type: 'stock-in',
      assetKind: 'consumable',
      assetId: asset.id,
      assetName: asset.name,
      quantity: asset.quantity,
      userId: actor.id,
      userName: actor.name,
    });

    return asset;
  }

  async update(id: string, dto: UpdateConsumableAssetDto) {
    await this.findOne(id);
    return this.prisma.consumableAsset.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.consumableAsset.delete({ where: { id } });
    return { success: true };
  }

  async stockIn(id: string, dto: StockInDto, actor: AuthUser) {
    const asset = await this.findOne(id);

    const updated = await this.prisma.consumableAsset.update({
      where: { id },
      data: { quantity: { increment: dto.quantity } },
    });

    await this.logsService.create({
      type: 'stock-in',
      assetKind: 'consumable',
      assetId: asset.id,
      assetName: asset.name,
      quantity: dto.quantity,
      note: dto.note,
      userId: actor.id,
      userName: actor.name,
    });

    return updated;
  }

  async stockOut(id: string, dto: StockOutDto, actor: AuthUser) {
    const asset = await this.findOne(id);

    if (asset.quantity < dto.quantity) {
      throw new BadRequestException(`Stok tidak cukup. Tersisa ${asset.quantity} ${asset.unit}`);
    }

    const updated = await this.prisma.consumableAsset.update({
      where: { id },
      data: { quantity: { decrement: dto.quantity } },
    });

    await this.logsService.create({
      type: 'stock-out',
      assetKind: 'consumable',
      assetId: asset.id,
      assetName: asset.name,
      quantity: dto.quantity,
      note: dto.note,
      userId: actor.id,
      userName: actor.name,
    });

    return updated;
  }
}
