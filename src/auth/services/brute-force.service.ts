import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';

@Injectable()
export class BruteForceService {
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number; // seconds

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {
    this.maxAttempts = this.configService.get('BRUTE_FORCE_MAX_ATTEMPTS', 5);
    this.lockoutDuration = this.configService.get(
      'BRUTE_FORCE_LOCKOUT_DURATION',
      900,
    );
  }

  async checkAndBlock(identifier: string, ipAddress: string): Promise<void> {
    const cutoff = new Date(Date.now() - this.lockoutDuration * 1000);

    const failedAttempts = await this.loginAttemptRepository
      .createQueryBuilder('attempt')
      .where(
        '(attempt.identifier = :identifier OR attempt.ipAddress = :ipAddress)',
        { identifier, ipAddress },
      )
      .andWhere('attempt.success = :success', { success: false })
      .andWhere('attempt.createdAt > :cutoff', { cutoff })
      .getCount();

    if (failedAttempts >= this.maxAttempts) {
      await this.lockUserAccount(identifier);
      throw new UnauthorizedException(
        'Too many failed attempts. Account temporarily locked. Try again in 15 minutes.',
      );
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user?.lockedUntil) return false;
    return user.lockedUntil > new Date();
  }

  async getRemainingLockoutTime(email: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user?.lockedUntil) return 0;
    const remaining = user.lockedUntil.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  private async lockUserAccount(identifier: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: identifier },
    });
    if (user) {
      const lockedUntil = new Date(
        Date.now() + this.lockoutDuration * 1000,
      );
      await this.userRepository.update(user.id, { lockedUntil });
    }
  }

  async clearFailedAttempts(identifier: string): Promise<void> {
    await this.loginAttemptRepository.delete({ identifier });
  }
}
