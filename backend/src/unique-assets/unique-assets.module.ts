import { Module } from '@nestjs/common';
import { UniqueAssetsService } from './unique-assets.service';
import { UniqueAssetsController } from './unique-assets.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [LogsModule],
  controllers: [UniqueAssetsController],
  providers: [UniqueAssetsService],
})
export class UniqueAssetsModule {}
