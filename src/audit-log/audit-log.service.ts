import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  ipAddress: string;
  method: string;
  route: string;
  userAgent?: string;
  statusCode: number;
  responseTime: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(log);
  }

  async createAsync(dto: CreateAuditLogDto): Promise<void> {
    this.create(dto).catch((err) =>
      console.error('Failed to write audit log:', err),
    );
  }
}
