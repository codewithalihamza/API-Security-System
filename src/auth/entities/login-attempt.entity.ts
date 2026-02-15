import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  identifier: string; // email or IP

  @Column()
  ipAddress: string;

  @Column({ default: false })
  success: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
