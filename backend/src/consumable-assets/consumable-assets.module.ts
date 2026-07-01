import { Module } from '@nestjs/common';
import { ConsumableAssetsService } from './consumable-assets.service';
import { ConsumableAssetsController } from './consumable-assets.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [LogsModule],
  controllers: [ConsumableAssetsController],
  providers: [ConsumableAssetsService],
})
export class ConsumableAssetsModule {}
