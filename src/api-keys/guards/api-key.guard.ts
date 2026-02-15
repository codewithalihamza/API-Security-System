import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';
import { API_KEY_REQUIRED_KEY } from '../../common/decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeysService: ApiKeysService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isApiKeyRequired = this.reflector.getAllAndOverride<boolean>(
      API_KEY_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isApiKeyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const user = await this.apiKeysService.validate(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    request['user'] = user;
    return true;
  }

  private extractApiKey(request: Request): string | null {
    const authHeader = request.headers['x-api-key'];
    if (typeof authHeader === 'string') {
      return authHeader.trim();
    }
    const bearer = request.headers.authorization;
    if (bearer?.startsWith('Bearer ')) {
      return bearer.slice(7).trim();
    }
    return null;
  }
}
