import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { CreateUniqueAssetDto } from './dto/create-unique-asset.dto';
import { UpdateUniqueAssetDto } from './dto/update-unique-asset.dto';
import { BorrowAssetDto, ReturnAssetDto } from './dto/borrow-return.dto';
import { AuthUser } from '../auth/strategies/jwt.strategy';

export interface FindUniqueAssetsQuery {
  site?: string;
  status?: string;
  category?: string;
  search?: string;
}

const includeBorrower = {
  borrowedBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class UniqueAssetsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  findAll(query: FindUniqueAssetsQuery) {
    const where: Record<string, unknown> = {};
    if (query.site && query.site !== 'all') where.site = query.site;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.uniqueAsset.findMany({
      where,
      include: includeBorrower,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.uniqueAsset.findUnique({ where: { id }, include: includeBorrower });
    if (!asset) throw new NotFoundException('Aset tidak ditemukan');
    return asset;
  }

  async create(dto: CreateUniqueAssetDto, actor: AuthUser) {
    const existing = await this.prisma.uniqueAsset.findUnique({ where: { serialNumber: dto.serialNumber } });
    if (existing) throw new BadRequestException('Serial number sudah terdaftar');

    const asset = await this.prisma.uniqueAsset.create({
      data: { ...dto, status: 'available' },
    });

    await this.logsService.create({
      type: 'stock-in',
      assetKind: 'unique',
      assetId: asset.id,
      assetName: asset.name,
      serial: asset.serialNumber,
      quantity: 1,
      userId: actor.id,
      userName: actor.name,
    });

    return asset;
  }

  async update(id: string, dto: UpdateUniqueAssetDto) {
    await this.findOne(id);
    return this.prisma.uniqueAsset.update({ where: { id }, data: dto, include: includeBorrower });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.uniqueAsset.delete({ where: { id } });
    return { success: true };
  }

  async borrow(id: string, dto: BorrowAssetDto, actor: AuthUser) {
    const asset = await this.findOne(id);

    if (asset.status !== 'available') {
      throw new BadRequestException('Aset ini sedang tidak tersedia untuk dipinjam');
    }

    const durationDays = dto.durationDays ?? 14;
    const borrowedAt = new Date();
    const returnDue = new Date(borrowedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.uniqueAsset.update({
      where: { id },
      data: {
        status: 'borrowed',
        borrowedById: actor.id,
        borrowedAt,
        returnDue,
      },
      include: includeBorrower,
    });

    await this.logsService.create({
      type: 'borrow',
      assetKind: 'unique',
      assetId: asset.id,
      assetName: asset.name,
      serial: asset.serialNumber,
      note: dto.note,
      userId: actor.id,
      userName: actor.name,
    });

    return updated;
  }

  async returnAsset(id: string, dto: ReturnAssetDto, actor: AuthUser) {
    const asset = await this.findOne(id);

    if (asset.status !== 'borrowed') {
      throw new BadRequestException('Aset ini sedang tidak dalam status dipinjam');
    }

    const isOwner = asset.borrowedById === actor.id;
    if (actor.role !== 'admin' && !isOwner) {
      throw new BadRequestException('Hanya peminjam atau admin yang bisa mengembalikan aset ini');
    }

    const updated = await this.prisma.uniqueAsset.update({
      where: { id },
      data: {
        status: 'available',
        borrowedById: null,
        borrowedAt: null,
        returnDue: null,
      },
      include: includeBorrower,
    });

    await this.logsService.create({
      type: 'return',
      assetKind: 'unique',
      assetId: asset.id,
      assetName: asset.name,
      serial: asset.serialNumber,
      note: dto.note,
      userId: actor.id,
      userName: actor.name,
    });

    return updated;
  }
}
