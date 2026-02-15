import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IpBlacklistService } from './ip-blacklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BlockIpDto } from './dto/block-ip.dto';

@Controller('ip-blacklist')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class IpBlacklistController {
  constructor(private ipBlacklistService: IpBlacklistService) {}

  @Post()
  async block(@Body() blockIpDto: BlockIpDto) {
    return this.ipBlacklistService.block(
      blockIpDto.ipAddress,
      blockIpDto.reason,
      blockIpDto.isPermanent,
      blockIpDto.expiresIn,
    );
  }

  @Delete(':ip')
  async unblock(@Param('ip') ipAddress: string) {
    await this.ipBlacklistService.unblock(ipAddress);
    return { message: 'IP unblocked successfully' };
  }
}
