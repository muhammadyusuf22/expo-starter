/**
 * Database Schema for Spenduit
 * Using expo-sqlite with raw SQL queries
 */

// Table Schemas
export const CREATE_TABLES_SQL = `
-- Wallets (Cash, Bank, E-Wallet)
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('cash', 'bank', 'ewallet', 'other')),
  initial_balance REAL DEFAULT 0,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#10B981',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Budgets (Monthly limits per category)
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL UNIQUE,
  monthly_limit REAL DEFAULT 0
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  wallet_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Goals (Savings Targets)
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  deadline TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#10B981',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Goal Transactions (Topup/Withdraw history)
CREATE TABLE IF NOT EXISTS goal_transactions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('topup', 'withdraw')),
  amount REAL NOT NULL,
  note TEXT,
  wallet_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);
`;

// TypeScript Types
export interface Wallet {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet" | "other";
  initial_balance: number;
  icon: string;
  color: string;
  created_at: string;
  // Computed
  current_balance?: number;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  // Computed
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string | null;
  wallet_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  created_at: string;
  // Computed
  percentage?: number;
  days_remaining?: number | null;
}

export interface GoalTransaction {
  id: string;
  goal_id: string;
  type: "topup" | "withdraw";
  amount: number;
  note: string | null;
  wallet_id: string | null;
  created_at: string;
}

// Default Categories
export const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Tagihan & Utilitas",
  "Hiburan",
  "Kesehatan",
  "Tabungan",
  "Lainnya",
];

export const INCOME_CATEGORIES = [
  "Gaji Utama",
  "Freelance / Side Job",
  "Bonus / THR",
  "Investasi",
  "Pencairan Tabungan",
  "Lainnya",
];

// Default Wallets
export const DEFAULT_WALLETS: Omit<Wallet, "created_at" | "current_balance">[] =
  [
    {
      id: "WALLET-CASH",
      name: "Cash",
      type: "cash",
      initial_balance: 0,
      icon: "💵",
      color: "#10B981",
    },
    {
      id: "WALLET-BANK",
      name: "Rekening Bank",
      type: "bank",
      initial_balance: 0,
      icon: "🏦",
      color: "#3B82F6",
    },
    {
      id: "WALLET-EWALLET",
      name: "E-Wallet",
      type: "ewallet",
      initial_balance: 0,
      icon: "📱",
      color: "#8B5CF6",
    },
  ];

// Default Budgets
export const DEFAULT_BUDGETS: Omit<
  Budget,
  "id" | "spent" | "remaining" | "percentage"
>[] = [
  { category: "Makanan & Minuman", monthly_limit: 2000000 },
  { category: "Transportasi", monthly_limit: 1000000 },
  { category: "Belanja", monthly_limit: 1500000 },
  { category: "Tagihan & Utilitas", monthly_limit: 1000000 },
  { category: "Hiburan", monthly_limit: 500000 },
  { category: "Kesehatan", monthly_limit: 500000 },
  { category: "Lainnya", monthly_limit: 500000 },
];
