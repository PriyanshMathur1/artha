import type { MFSchemeFull } from '@/lib/data/mfapi';

export interface MFInput {
  scheme: MFSchemeFull;
  /** Annual returns (1y/3y/5y) — computed once and shared across agents */
  trailing: { ret1y: number | null; ret3y: number | null; ret5y: number | null };
  /** Daily log returns derived from NAV history */
  dailyReturns: number[];
  /** Optional category-level stats for relative scoring (median TER, median 3y return, etc.) */
  categoryStats?: {
    medianTER?: number;
    medianRet3y?: number;
    topQuartileRet3y?: number;
    bottomQuartileRet3y?: number;
  };
  /** Manual overrides — fund manager tenure, declared style, etc. */
  meta?: {
    expenseRatio?: number;
    aumCr?: number;
    fundManagerTenureYears?: number;
    declaredStyle?: 'large' | 'mid' | 'small' | 'flexi' | 'multi';
    isElss?: boolean;
    inceptionDate?: Date;
  };
}
