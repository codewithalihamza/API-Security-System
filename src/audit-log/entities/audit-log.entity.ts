import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  ipAddress: string;

  @Column()
  method: string;

  @Column()
  route: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'int', default: 0 })
  statusCode: number;

  @Column({ type: 'int', default: 0 })
  responseTime: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
