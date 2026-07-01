import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ConsumableAssetsService } from './consumable-assets.service';
import { CreateConsumableAssetDto } from './dto/create-consumable-asset.dto';
import { UpdateConsumableAssetDto } from './dto/update-consumable-asset.dto';
import { StockInDto, StockOutDto } from './dto/stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consumable-assets')
export class ConsumableAssetsController {
  constructor(private service: ConsumableAssetsService) {}

  @Get()
  findAll(
    @Query('site') site?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    return this.service.findAll({ site, category, search, lowStockOnly: lowStockOnly === 'true' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Hanya admin yang bisa menambah item baru
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateConsumableAssetDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsumableAssetDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // Hanya admin yang bisa stock-in (restock)
  @Roles('admin')
  @Post(':id/stock-in')
  stockIn(@Param('id') id: string, @Body() dto: StockInDto, @CurrentUser() user: AuthUser) {
    return this.service.stockIn(id, dto, user);
  }

  // Stock-out ("Take") boleh siapa saja yang login
  @Post(':id/stock-out')
  stockOut(@Param('id') id: string, @Body() dto: StockOutDto, @CurrentUser() user: AuthUser) {
    return this.service.stockOut(id, dto, user);
  }
}
