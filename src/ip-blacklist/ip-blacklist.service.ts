import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { BlockedIp } from './entities/blocked-ip.entity';

@Injectable()
export class IpBlacklistService {
  constructor(
    @InjectRepository(BlockedIp)
    private blockedIpRepository: Repository<BlockedIp>,
  ) {}

  async isBlocked(ipAddress: string): Promise<boolean> {
    const blocked = await this.blockedIpRepository.findOne({
      where: { ipAddress },
    });

    if (!blocked) return false;
    if (blocked.isPermanent) return true;
    if (blocked.expiresAt && blocked.expiresAt > new Date()) return true;

    await this.blockedIpRepository.delete({ id: blocked.id });
    return false;
  }

  async block(
    ipAddress: string,
    reason?: string,
    isPermanent = false,
    expiresIn?: number,
  ): Promise<BlockedIp> {
    const existing = await this.blockedIpRepository.findOne({
      where: { ipAddress },
    });

    if (existing) {
      await this.blockedIpRepository.update(existing.id, {
        reason,
        isPermanent,
        expiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined,
      });
      const updated = await this.blockedIpRepository.findOne({
        where: { id: existing.id },
      });
      return updated ?? existing;
    }

    const blocked = this.blockedIpRepository.create({
      ipAddress,
      reason,
      isPermanent,
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined,
    });

    return this.blockedIpRepository.save(blocked);
  }

  async unblock(ipAddress: string): Promise<void> {
    await this.blockedIpRepository.delete({ ipAddress });
  }

  async cleanupExpired(): Promise<void> {
    await this.blockedIpRepository.delete({
      isPermanent: false,
      expiresAt: LessThan(new Date()),
    });
  }
}
