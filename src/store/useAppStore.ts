/**
 * Main App Store - Transactions, Goals, Wallets, Budgets
 */

import {
  GOAL_TYPES,
  SYSTEM_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/constants/app";
import type { Budget, Goal, GoalTransaction, Transaction, Wallet } from "@/db";
import { generateId, getCurrentTimestamp, getDatabase } from "@/db";
import {
  GoalRepository,
  GoalTransactionRepository,
} from "@/repositories/goal.repository";
import { TransactionRepository } from "@/repositories/transaction.repository";
import { WalletRepository } from "@/repositories/wallet.repository";
import { isCurrentMonth } from "@/utils";
import { create } from "zustand";

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  budgetOverview: Budget[];
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: Transaction[];
}

export interface DailyTrend {
  day: number;
  amount: number;
}

export interface CategoryBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface MonthlyReport {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  dailyTrend: DailyTrend[];
  categoryBreakdown: CategoryBreakdown[];
}

interface AppState {
  // Data
  isLoading: boolean;
  transactions: Transaction[];
  goals: Goal[];
  wallets: Wallet[];
  budgets: Budget[];
  dashboard: DashboardData | null;

  // Actions
  initialize: () => Promise<void>;
  loadDashboard: () => Promise<void>;

  // Transactions
  loadTransactions: () => Promise<void>;
  addTransaction: (
    tx: Omit<Transaction, "id" | "created_at">,
  ) => Promise<string>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactions: (
    limit?: number,
    offset?: number,
    filters?: { startDate?: string; endDate?: string; walletId?: string },
  ) => Promise<Transaction[]>;

  getMonthlyReport: (month: number, year: number) => Promise<MonthlyReport>;

  // Goals
  loadGoals: () => Promise<void>;
  addGoal: (
    goal: Omit<Goal, "id" | "created_at" | "current_amount">,
  ) => Promise<string>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  topupGoal: (
    goalId: string,
    amount: number,
    note: string,
    walletId: string | null,
  ) => Promise<void>;
  withdrawGoal: (
    goalId: string,
    amount: number,
    note: string,
    walletId: string | null,
  ) => Promise<void>;

  // Wallets
  loadWallets: () => Promise<void>;
  addWallet: (
    wallet: Omit<Wallet, "id" | "created_at" | "current_balance"> & {
      initial_balance?: number;
    },
  ) => Promise<string>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<boolean>;
  transferBetweenWallets: (
    fromId: string,
    toId: string,
    amount: number,
    note: string,
  ) => Promise<void>;

  // Budgets
  loadBudgets: () => Promise<void>;
  updateBudget: (category: string, limit: number) => Promise<void>;

  // Goal Transactions
  getGoalTransactions: (
    goalId: string,
    limit?: number,
    offset?: number,
  ) => Promise<GoalTransaction[]>;
  updateGoalTransaction: (
    id: string,
    updates: Partial<GoalTransaction>,
  ) => Promise<void>;
  deleteGoalTransaction: (id: string) => Promise<void>;
}

// Category colors for chart
const CATEGORY_COLORS: Record<string, string> = {
  "Makanan & Minuman": "#10B981",
  Transportasi: "#3B82F6",
  Belanja: "#8B5CF6",
  "Tagihan & Utilitas": "#F59E0B",
  Hiburan: "#EC4899",
  Kesehatan: "#06B6D4",
  Tabungan: "#6366F1",
  "Saldo Awal": "#0F766E",
  Lainnya: "#6B7280",
};

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: true,
  transactions: [],
  goals: [],
  wallets: [],
  budgets: [],
  dashboard: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      await get().loadWallets();
      await get().loadBudgets();
      await get().loadTransactions();
      await get().loadGoals();
      await get().loadDashboard();
    } finally {
      set({ isLoading: false });
    }
  },

  loadDashboard: async () => {
    const { transactions, budgets, wallets } = get();

    // Filter current month transactions
    const monthTransactions = transactions.filter((tx) =>
      isCurrentMonth(tx.date),
    );

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    monthTransactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        categoryTotals[tx.category] =
          (categoryTotals[tx.category] || 0) + tx.amount;
      }
    });

    // Calculate total balance from all wallets (initial + transactions)
    const totalWalletBalance = wallets.reduce(
      (sum, w) => sum + (w.current_balance || 0),
      0,
    );

    // Savings rate based on monthly income vs expense
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
        : 0;

    // Budget overview with spent amounts
    const budgetOverview = budgets
      .map((b) => ({
        ...b,
        spent: categoryTotals[b.category] || 0,
        remaining: b.monthly_limit - (categoryTotals[b.category] || 0),
        percentage:
          b.monthly_limit > 0
            ? Math.min(
                Math.round(
                  ((categoryTotals[b.category] || 0) / b.monthly_limit) * 100,
                ),
                100,
              )
            : 0,
      }))
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    // Category breakdown for chart
    const categoryBreakdown = Object.entries(categoryTotals).map(
      ([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] || "#6B7280",
      }),
    );

    // Recent transactions (last 5)
    const recentTransactions = transactions.slice(0, 5);

    set({
      dashboard: {
        balance: totalWalletBalance, // Use total wallet balance instead of just income-expense
        totalIncome,
        totalExpense,
        savingsRate,
        budgetOverview,
        categoryBreakdown,
        recentTransactions,
      },
    });
  },

  // =====================
  // TRANSACTIONS
  // =====================
  loadTransactions: async () => {
    const rows = await TransactionRepository.getAll();
    set({ transactions: rows });
  },

  addTransaction: async (tx) => {
    const id = generateId("TRX");
    const created_at = getCurrentTimestamp();

    await TransactionRepository.create({
      id,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      note: tx.note || null,
      wallet_id: tx.wallet_id || null, // Ensure wallet_id is handled
      created_at,
    });

    await get().loadTransactions();
    await get().loadWallets(); // Reload wallets to update balance
    await get().loadDashboard();
    return id;
  },

  updateTransaction: async (id, updates) => {
    // 1. Check for Goal Link to sync Amount/Note changes
    const tx = await TransactionRepository.findById(id);
    if (
      tx &&
      (tx.category === SYSTEM_CATEGORIES.SAVINGS ||
        tx.category === SYSTEM_CATEGORIES.SAVINGS_WITHDRAWAL)
    ) {
      // Find by ID match or legacy
      let gtx = await GoalTransactionRepository.findByTransactionId(id);
      if (!gtx) {
        const typeToCheck =
          tx.category === SYSTEM_CATEGORIES.SAVINGS
            ? GOAL_TYPES.TOPUP
            : GOAL_TYPES.WITHDRAW;
        gtx = await GoalTransactionRepository.findByFuzzy(
          tx.wallet_id || "",
          typeToCheck,
          tx.created_at,
        );
      }

      if (gtx) {
        // Sync Goal System
        const goalUpdates: Partial<GoalTransaction> = {};
        if (updates.amount !== undefined) goalUpdates.amount = updates.amount;
        if (updates.note !== undefined) goalUpdates.note = updates.note;

        if (Object.keys(goalUpdates).length > 0) {
          await get().updateGoalTransaction(gtx.id, goalUpdates);
        }
      }
    }

    await TransactionRepository.update(id, updates);

    await get().loadTransactions();
    await get().loadWallets(); // Reload wallets to update balance
    await get().loadDashboard();
  },

  deleteTransaction: async (id) => {
    // 1. Get transaction details first
    const tx = await TransactionRepository.findById(id);
    if (!tx) return;

    // 2. Check if it's a Goal Topup or Withdraw to update Goal balance/history
    if (
      tx.category === SYSTEM_CATEGORIES.SAVINGS ||
      tx.category === SYSTEM_CATEGORIES.SAVINGS_WITHDRAWAL
    ) {
      // Try finding by transaction_id first
      let goalTx = await GoalTransactionRepository.findByTransactionId(id);

      if (!goalTx) {
        // Fallback legacy fuzzy match
        const isTopup = tx.category === SYSTEM_CATEGORIES.SAVINGS;
        const typeToCheck = isTopup ? GOAL_TYPES.TOPUP : GOAL_TYPES.WITHDRAW;
        goalTx = await GoalTransactionRepository.findByFuzzy(
          tx.wallet_id || "",
          typeToCheck,
          tx.created_at,
        );
      }

      if (goalTx) {
        // DELEGATE to deleteGoalTransaction
        await get().deleteGoalTransaction(goalTx.id);

        // deleteGoalTransaction reloads goals/wallets but not dashboard/transactions
        await get().loadTransactions();
        await get().loadDashboard();
        return;
      }
    }

    // 3. Delete the transaction
    await TransactionRepository.delete(id);

    // 4. Reload everything
    await get().loadTransactions();
    await get().loadWallets();
    await get().loadDashboard();
  },

  getTransactions: async (limit = 20, offset = 0, filters) => {
    return TransactionRepository.findAll(limit, offset, filters);
  },

  // =====================
  // GOALS
  // =====================
  loadGoals: async () => {
    const rows = await GoalRepository.findAll();

    // Calculate percentage and days remaining
    const goalsWithComputed = rows.map((g) => ({
      ...g,
      percentage:
        g.target_amount > 0
          ? Math.min(
              Math.round(((g.current_amount || 0) / g.target_amount) * 100),
              100,
            )
          : 0,
      days_remaining: g.deadline
        ? Math.ceil(
            (new Date(g.deadline).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    }));

    set({ goals: goalsWithComputed });
  },

  addGoal: async (goal) => {
    const id = generateId("GOAL");
    const created_at = getCurrentTimestamp();

    await GoalRepository.create({
      id,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: 0,
      deadline: goal.deadline || null,
      icon: goal.icon || "🎯",
      color: goal.color || "#10B981",
      created_at,
    });

    await get().loadGoals();
    return id;
  },

  updateGoal: async (id, updates) => {
    await GoalRepository.update(id, updates);
    await get().loadGoals();
  },

  deleteGoal: async (id) => {
    await GoalTransactionRepository.deleteByGoalId(id);
    await GoalRepository.delete(id);
    await get().loadGoals();
  },

  topupGoal: async (goalId, amount, note, walletId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    // 1. Create Wallet Transaction first if walletId provided
    let transactionId: string | null = null;
    if (walletId) {
      transactionId = await get().addTransaction({
        date: getCurrentTimestamp().split("T")[0],
        type: TRANSACTION_TYPES.EXPENSE,
        category: SYSTEM_CATEGORIES.SAVINGS,
        amount,
        note: `Topup Goal: ${goal.name}`,
        wallet_id: walletId,
      });
    }

    // 2. Goal Balance is computed automatically, no update needed

    // 3. Log goal transaction with transaction_id
    const txId = generateId("GTX");
    await GoalTransactionRepository.create({
      id: txId,
      goal_id: goalId,
      type: GOAL_TYPES.TOPUP,
      amount: amount,
      note: note || "Topup",
      wallet_id: walletId || null,
      created_at: getCurrentTimestamp(),
      transaction_id: transactionId,
    });

    await get().loadGoals();
  },

  withdrawGoal: async (goalId, amount, note, walletId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;
    const currentAmount = goal.current_amount || 0;

    if (amount > currentAmount) {
      return;
    }

    // 1. Create Wallet Transaction first if walletId provided
    let transactionId: string | null = null;
    if (walletId) {
      transactionId = await get().addTransaction({
        date: getCurrentTimestamp().split("T")[0],
        type: TRANSACTION_TYPES.INCOME,
        category: SYSTEM_CATEGORIES.SAVINGS_WITHDRAWAL,
        amount,
        note: `Withdraw Goal: ${goal.name}`,
        wallet_id: walletId,
      });
    }

    // 2. Goal Balance Computed Automatically

    // 3. Log goal transaction
    const txId = generateId("GTX");
    await GoalTransactionRepository.create({
      id: txId,
      goal_id: goalId,
      type: GOAL_TYPES.WITHDRAW,
      amount: amount,
      note: note || "Withdraw",
      wallet_id: walletId || null,
      created_at: getCurrentTimestamp(),
      transaction_id: transactionId,
    });

    await get().loadGoals();
  },

  getGoalTransactions: async (goalId, limit = 20, offset = 0) => {
    return GoalTransactionRepository.findByGoalId(goalId, limit, offset);
  },

  updateGoalTransaction: async (id, updates) => {
    const gtx = await GoalTransactionRepository.findById(id);
    if (!gtx) return;

    // 1. Handle Amount Change
    // Balance is computed automatically. We only need to sync linked Wallet Transaction.
    if (updates.amount !== undefined && updates.amount !== gtx.amount) {
      // Update linked wallet transaction
      let linkedTx: Transaction | null = null;
      if (gtx.transaction_id) {
        linkedTx = await TransactionRepository.findById(gtx.transaction_id);
      }

      if (linkedTx) {
        await TransactionRepository.update(linkedTx.id, {
          amount: updates.amount,
        });
      }
    }

    // 2. Update Note in linked transaction
    if (updates.note !== undefined && updates.note !== gtx.note) {
      if (gtx.transaction_id) {
        await TransactionRepository.update(gtx.transaction_id, {
          note: updates.note,
        });
      }
    }

    // 3. Update the GT itself
    await GoalTransactionRepository.update(id, updates);

    await get().loadGoals();
    await get().loadWallets();
  },

  deleteGoalTransaction: async (id) => {
    const gtx = await GoalTransactionRepository.findById(id);
    if (!gtx) return;

    // 1. Goal Balance Reverts Automatically (Computed)

    // 2. Delete linked wallet transaction
    if (gtx.transaction_id) {
      await TransactionRepository.delete(gtx.transaction_id);
    }
    // Legacy fallback for deletion?
    // Again, assuming migration.

    // 3. Delete GT
    await GoalTransactionRepository.delete(id);

    await get().loadGoals();
    await get().loadWallets();
  },

  // =====================
  // WALLETS
  // =====================
  loadWallets: async () => {
    const wallets = await WalletRepository.findAll();
    // Balances are now computed in SQL (WalletRepository)
    set({ wallets });
  },

  addWallet: async (wallet) => {
    const id = generateId("WALLET");
    const created_at = getCurrentTimestamp();

    await WalletRepository.create({
      id,
      name: wallet.name,
      type: wallet.type,
      icon: wallet.icon || "💰",
      color: wallet.color || "#10B981",
      created_at,
    });

    // If initial balance > 0, create an income transaction
    // This is the single source of truth for wallet balance
    if (wallet.initial_balance && wallet.initial_balance > 0) {
      const txId = generateId("TRX");
      const created_at_tx = getCurrentTimestamp();
      const date = created_at_tx.split("T")[0];

      await TransactionRepository.create({
        id: txId,
        date: date,
        type: TRANSACTION_TYPES.INCOME,
        category: SYSTEM_CATEGORIES.INITIAL_BALANCE,
        amount: wallet.initial_balance,
        note: "Saldo Awal Wallet",
        wallet_id: id,
        created_at: created_at_tx,
      });
    }

    await get().loadWallets();
    await get().loadTransactions();
    await get().loadDashboard();
    return id;
  },

  updateWallet: async (id, updates) => {
    await WalletRepository.update(id, updates);
    await get().loadWallets();
  },

  deleteWallet: async (id) => {
    // Check if wallet has transactions
    const txCount = await TransactionRepository.findAll(1, 0, { walletId: id });

    if (txCount && txCount.length > 0) {
      return false; // Can't delete wallet with transactions
    }

    await WalletRepository.delete(id);
    await get().loadWallets();
    return true;
  },

  transferBetweenWallets: async (fromId, toId, amount, note) => {
    const timestamp = getCurrentTimestamp();
    const date = timestamp.split("T")[0];

    // Create expense from source
    await get().addTransaction({
      date,
      type: "expense",
      category: "Transfer Keluar",
      amount,
      note: note || "Transfer antar wallet",
      wallet_id: fromId,
    });

    // Create income to destination
    await get().addTransaction({
      date,
      type: "income",
      category: "Transfer Masuk",
      amount,
      note: note || "Transfer antar wallet",
      wallet_id: toId,
    });

    await get().loadWallets();
  },

  // =====================
  // BUDGETS
  // =====================
  loadBudgets: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Budget>("SELECT * FROM budgets");
    set({ budgets: rows });
  },

  updateBudget: async (category, limit) => {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE budgets SET monthly_limit = ? WHERE category = ?",
      [limit, category],
    );
    await get().loadBudgets();
    await get().loadDashboard();
  },

  getMonthlyReport: async (month: number, year: number) => {
    const db = await getDatabase();
    // month is 1-indexed (1 = January)
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    const query = `SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date ASC`;
    const rows = await db.getAllAsync<Transaction>(query, [startStr, endStr]);

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByDay: Record<number, number> = {};
    const categoryTotals: Record<string, number> = {};

    rows.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        const day = parseInt(t.date.split("-")[2], 10);
        expenseByDay[day] = (expenseByDay[day] || 0) + t.amount;
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      }
    });

    const netSavings = totalIncome - totalExpense;

    // Daily Trend
    const dailyTrend: DailyTrend[] = Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      return { day, amount: expenseByDay[day] || 0 };
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalIncome,
      totalExpense,
      netSavings,
      dailyTrend,
      categoryBreakdown,
    };
  },
}));
