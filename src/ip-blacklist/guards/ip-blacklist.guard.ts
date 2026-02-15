import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { IpBlacklistService } from '../ip-blacklist.service';

@Injectable()
export class IpBlacklistGuard implements CanActivate {
  constructor(private ipBlacklistService: IpBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ipAddress = this.getClientIp(request);

    const isBlocked = await this.ipBlacklistService.isBlocked(ipAddress);
    if (isBlocked) {
      throw new ForbiddenException('Access denied. Your IP has been blocked.');
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
