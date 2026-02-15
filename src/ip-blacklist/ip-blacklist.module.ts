import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpBlacklistService } from './ip-blacklist.service';
import { IpBlacklistController } from './ip-blacklist.controller';
import { IpBlacklistGuard } from './guards/ip-blacklist.guard';
import { BlockedIp } from './entities/blocked-ip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedIp])],
  controllers: [IpBlacklistController],
  providers: [IpBlacklistService, IpBlacklistGuard],
  exports: [IpBlacklistService, IpBlacklistGuard],
})
export class IpBlacklistModule {}
