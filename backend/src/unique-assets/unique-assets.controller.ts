import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UniqueAssetsService } from './unique-assets.service';
import { CreateUniqueAssetDto } from './dto/create-unique-asset.dto';
import { UpdateUniqueAssetDto } from './dto/update-unique-asset.dto';
import { BorrowAssetDto, ReturnAssetDto } from './dto/borrow-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unique-assets')
export class UniqueAssetsController {
  constructor(private service: UniqueAssetsService) {}

  // Semua user yang login boleh lihat daftar aset
  @Get()
  findAll(
    @Query('site') site?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ site, status, category, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Hanya admin yang bisa tambah aset baru (Stock In Unique)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateUniqueAssetDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUniqueAssetDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // Borrow: boleh siapa saja yang login
  @Post(':id/borrow')
  borrow(@Param('id') id: string, @Body() dto: BorrowAssetDto, @CurrentUser() user: AuthUser) {
    return this.service.borrow(id, dto, user);
  }

  // Return: divalidasi di service (admin atau peminjam aslinya)
  @Post(':id/return')
  returnAsset(@Param('id') id: string, @Body() dto: ReturnAssetDto, @CurrentUser() user: AuthUser) {
    return this.service.returnAsset(id, dto, user);
  }
}
