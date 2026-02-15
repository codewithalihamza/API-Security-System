import { Injectable } from '@nestjs/common';

/**
 * In-memory token blacklist for logout.
 * Note: Does not persist across restarts; use Redis for multi-instance deployments.
 */
@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Map<string, number>();

  add(token: string, expiresAtSeconds: number): void {
    const ttl = expiresAtSeconds - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      this.blacklist.set(token, Date.now() + ttl * 1000);
      setTimeout(() => this.blacklist.delete(token), ttl * 1000);
    }
  }

  has(token: string): boolean {
    const expiresAt = this.blacklist.get(token);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.blacklist.delete(token);
      return false;
    }
    return true;
  }
}
