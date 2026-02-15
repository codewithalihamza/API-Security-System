import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApiKeysService {
  private readonly keyPrefix: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {
    this.keyPrefix = this.configService.get('API_KEY_PREFIX', 'ask_');
  }

  async generate(userId: string, name: string): Promise<{ apiKey: string; id: string }> {
    const rawKey = `${this.keyPrefix}${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 12);
    const prefix = rawKey.substring(0, this.keyPrefix.length + 8);

    const apiKey = this.apiKeyRepository.create({
      name,
      keyHash,
      keyPrefix: prefix,
      userId,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return { apiKey: rawKey, id: saved.id };
  }

  async validate(apiKey: string): Promise<User | null> {
    const prefix = apiKey.substring(0, this.keyPrefix.length + 8);
    const keys = await this.apiKeyRepository.find({
      where: { keyPrefix: prefix, isActive: true },
      relations: ['user'],
    });

    for (const key of keys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash);
      if (isValid) {
        await this.apiKeyRepository.update(key.id, {
          lastUsedAt: new Date(),
        });
        return key.user;
      }
    }

    return null;
  }

  async findByUser(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      select: ['id', 'name', 'keyPrefix', 'isActive', 'lastUsedAt', 'createdAt'],
    });
  }

  async revoke(id: string, userId: string): Promise<void> {
    const result = await this.apiKeyRepository.update(
      { id, userId },
      { isActive: false },
    );
    if (result.affected === 0) {
      throw new NotFoundException('API key not found');
    }
  }
}
