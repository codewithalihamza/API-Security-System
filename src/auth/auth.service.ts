import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { BruteForceService } from './services/brute-force.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private bruteForceService: BruteForceService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}
  private readonly BCRYPT_ROUNDS = 12;

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  async login(
    user: User,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
  ): Promise<AuthTokens> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    await this.revokeRefreshToken(storedToken.id);

    return this.login(user, ipAddress);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    if (accessToken) {
      const token = accessToken.replace('Bearer ', '').trim();
      if (token) {
        await this.addToBlacklist(token);
      }
    }

    if (refreshToken) {
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });
      if (storedToken) {
        await this.revokeRefreshToken(storedToken.id);
      }
    }
  }

  async addToBlacklist(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number };
      if (decoded?.exp) {
        this.tokenBlacklistService.add(token, decoded.exp);
      }
    } catch {
      // Ignore invalid tokens
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklistService.has(token);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(
      password,
      this.configService.get('BCRYPT_ROUNDS', this.BCRYPT_ROUNDS),
    );
  }

  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
    });
  }

  private async createRefreshToken(
    user: User,
    ipAddress: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    const decoded = this.jwtService.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, { isRevoked: true });
  }

  async recordLoginAttempt(
    identifier: string,
    ipAddress: string,
    success: boolean,
  ): Promise<void> {
    await this.loginAttemptRepository.save({
      identifier,
      ipAddress,
      success,
    });
  }

  async checkBruteForce(identifier: string, ipAddress: string): Promise<void> {
    await this.bruteForceService.checkAndBlock(identifier, ipAddress);
  }
}
