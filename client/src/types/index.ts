export type UserRole = 'super_admin' | 'partner' | 'staff';

export interface PartnerProfile {
  _id: string;
  userId: string;
  partnerName: string;
  equitySharePercentage: number;
  profitScaleFactor: number;
  totalCapitalInvested: number;
  totalWithdrawn: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  partnerProfile?: PartnerProfile | null;
  partnerProfileRef?: PartnerProfile | string | null;
}

export type TransactionType = 'income_sale' | 'operating_expense' | 'capital_injection' | 'partner_draw';
export type TransactionStatus = 'pending' | 'approved';

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  transactionDate: string;
  status: TransactionStatus;
  loggedBy: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  partnerRef?: {
    _id: string;
    partnerName: string;
    equitySharePercentage?: number;
  } | null;
  createdAt?: string;
}

export interface PartnerSummaryItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  partnerName: string;
  equitySharePercentage: number;
  profitScaleFactor: number;
  totalCapitalInvested: number;
  totalWithdrawn: number;
  baseProfitShare: number;
  adjustedProfitShare: number;
  liveWithdrawableAmount: number;
  isCurrentUser?: boolean;
}

export interface EquityMetrics {
  grossSales: number;
  operatingExpenses: number;
  netBusinessProfit: number;
  totalCapitalInvested: number;
  totalWithdrawn: number;
  totalOwnerEquity: number;
}

export interface EquitySummaryResponse {
  metrics: EquityMetrics;
  partners: PartnerSummaryItem[];
  myPartnerProfile?: PartnerSummaryItem;
}

export interface ProfitDistributionLog {
  _id: string;
  partnerId: {
    _id: string;
    partnerName: string;
    equitySharePercentage: number;
  };
  scaleFactorAtPayout: number;
  amountPaid: number;
  payoutDate: string;
  approvedBy: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
}

export interface IncomeStatementReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalGrossSales: number;
    byCategory: { category: string; amount: number }[];
  };
  expenses: {
    totalOperatingExpenses: number;
    byCategory: { category: string; amount: number }[];
  };
  netOperatingProfit: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    cashAndEquivalents: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    totalLiabilities: number;
  };
  equity: {
    initialCapital: number;
    retainedEarnings: number;
    lessPartnerDraws: number;
    totalEquity: number;
    partnerBreakdown: {
      partnerId: string;
      name: string;
      equityPct: number;
      capitalInvested: number;
      netProfitShare: number;
      totalWithdrawn: number;
      endingEquity: number;
    }[];
  };
}
