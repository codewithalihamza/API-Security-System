import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<{ statusCode: number; on: (e: string, fn: () => void) => void }>();
    const startTime = Date.now();

    const userId = (request['user'] as { id?: string })?.id;
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown';
    const method = request.method;
    const route = request.route?.path || request.url;
    const userAgent = request.headers['user-agent'];

    response.on('finish', () => {
      const statusCode = response.statusCode || 0;
      const responseTime = Date.now() - startTime;
      this.auditLogService.createAsync({
        userId,
        ipAddress,
        method,
        route,
        userAgent,
        statusCode,
        responseTime,
      });
    });

    return next.handle().pipe(
      tap({
        error: () => {
          const statusCode = response.statusCode || 500;
          const responseTime = Date.now() - startTime;
          this.auditLogService.createAsync({
            userId,
            ipAddress,
            method,
            route,
            userAgent,
            statusCode,
            responseTime,
          });
        },
      }),
    );
  }
}
