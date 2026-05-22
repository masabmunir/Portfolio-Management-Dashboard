import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Holding } from './Holding';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'holding_id' })
  holdingId!: string;

  @ManyToOne(() => Holding, (holding) => holding.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'holding_id' })
  holding!: Holding;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  quantity!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  price!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, default: 0 })
  fees!: string;

  @Index()
  @Column({ type: 'timestamptz', name: 'executed_at' })
  executedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}