import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './Portfolio';
import { Transaction } from './Transaction';

export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  MUTUAL_FUND = 'MUTUAL_FUND',
  ETF = 'ETF',
}

@Entity('holdings')
export class Holding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'portfolio_id' })
  portfolioId!: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.holdings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Portfolio;

  @Column({ type: 'varchar', length: 20 })
  symbol!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AssetType,
    name: 'asset_type',
  })
  assetType!: AssetType;

  // High precision for fractional shares (e.g., 0.123456 of VTSAX)
  @Column({ type: 'numeric', precision: 18, scale: 6, default: 0 })
  quantity!: string;

  // Weighted-average cost basis per unit
  @Column({ type: 'numeric', precision: 18, scale: 4, default: 0, name: 'avg_cost' })
  avgCost!: string;

  // Manually maintained current price
  @Column({ type: 'numeric', precision: 18, scale: 4, default: 0, name: 'current_price' })
  currentPrice!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Transaction, (txn) => txn.holding)
  transactions!: Transaction[];
}