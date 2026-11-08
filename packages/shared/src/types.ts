import type { WalletType, TransactionType, CategoryType, RecurringFrequency } from './constants';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  openingBalance: string; // paisa string for BigInt JSON safety
  currentBalance: string; // calculated dynamically in paisa
  archived: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  shortLabel: string;
  color: number;
  archived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: string; // paisa string
  walletId: string;
  walletName?: string;
  toWalletId?: string | null;
  toWalletName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryShortLabel?: string | null;
  categoryColor?: number | null;
  occurredOn: string; // YYYY-MM-DD
  note?: string | null;
  recurringRuleId?: string | null;
  goalId?: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName?: string;
  categoryShortLabel?: string;
  categoryColor?: number;
  month: string; // YYYY-MM
  amount: string; // paisa string limit
  spentAmount: string; // paisa string spent this month
  remainingAmount?: string; // paisa string remaining
  percentage: number;
  status?: 'ok' | 'warning' | 'exceeded';
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: string; // paisa string
  currentAmount: string; // calculated from transactions in paisa
  dueMonth?: string | null;
  note?: string | null;
  percentage: number;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: string; // paisa string
  walletId: string;
  walletName?: string;
  categoryId: string;
  categoryName?: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  nextDueOn: string;
  active: boolean;
  note?: string | null;
}

export interface DashboardSummary {
  month: string;
  totalIncome: string; // paisa
  totalExpense: string; // paisa
  netSavings: string; // paisa
  totalBalance: string; // total across all wallets in paisa
  budgetSummary: {
    totalBudget: string;
    totalSpent: string;
    percentage: number;
    overBudgetCount: number;
  };
  categoryExpenses: Array<{
    categoryId: string;
    categoryName: string;
    categoryShortLabel: string;
    color: number;
    amount: string;
    percentage: number;
  }>;
  recentTransactions: Transaction[];
  upcomingBills: RecurringRule[];
}

export interface FinancialInsight {
  id: string;
  type: 'spike' | 'burn_rate' | 'savings_milestone' | 'bill_reminder' | 'top_expense';
  severity: 'info' | 'warning' | 'alert' | 'success';
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  metric?: string;
  categoryId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

