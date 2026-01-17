/**
 * Main App Store - Transactions, Goals, Wallets, Budgets
 */

import type { Budget, Goal, GoalTransaction, Transaction, Wallet } from "@/db";
import { generateId, getCurrentTimestamp, getDatabase } from "@/db";
import { isCurrentMonth } from "@/utils";
import { create } from "zustand";

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  budgetOverview: Budget[];
  categoryBreakdown: { label: string; value: number; color: string }[];
  recentTransactions: Transaction[];
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
    filters?: { startDate?: string; endDate?: string },
  ) => Promise<Transaction[]>;

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
    wallet: Omit<Wallet, "id" | "created_at" | "current_balance">,
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
    const db = await getDatabase();
    const rows = await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions ORDER BY date DESC, created_at DESC",
    );
    set({ transactions: rows });
  },

  addTransaction: async (tx) => {
    const db = await getDatabase();
    const id = generateId("TRX");
    const created_at = getCurrentTimestamp();

    await db.runAsync(
      "INSERT INTO transactions (id, date, type, category, amount, note, wallet_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        tx.date,
        tx.type,
        tx.category,
        tx.amount,
        tx.note || null,
        tx.wallet_id || null,
        created_at,
      ],
    );

    await get().loadTransactions();
    await get().loadWallets(); // Reload wallets to update balance
    await get().loadDashboard();
    return id;
  },

  updateTransaction: async (id, updates) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await db.runAsync(`UPDATE transactions SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);

    await get().loadTransactions();
    await get().loadWallets(); // Reload wallets to update balance
    await get().loadDashboard();
  },

  deleteTransaction: async (id) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
    await get().loadTransactions();
    await get().loadWallets(); // Reload wallets to update balance
    await get().loadDashboard();
  },

  getTransactions: async (limit = 20, offset = 0, filters) => {
    const db = await getDatabase();
    let query = "SELECT * FROM transactions";
    const params: any[] = [];

    if (filters?.startDate && filters?.endDate) {
      query += " WHERE date BETWEEN ? AND ?";
      params.push(filters.startDate, filters.endDate);
    }

    query += " ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = await db.getAllAsync<Transaction>(query, params);
    return rows;
  },

  // =====================
  // GOALS
  // =====================
  loadGoals: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Goal>(
      "SELECT * FROM goals ORDER BY created_at DESC",
    );

    // Calculate percentage and days remaining
    const goalsWithComputed = rows.map((g) => ({
      ...g,
      percentage:
        g.target_amount > 0
          ? Math.min(
              Math.round((g.current_amount / g.target_amount) * 100),
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
    const db = await getDatabase();
    const id = generateId("GOAL");
    const created_at = getCurrentTimestamp();

    await db.runAsync(
      "INSERT INTO goals (id, name, target_amount, current_amount, deadline, icon, color, created_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?)",
      [
        id,
        goal.name,
        goal.target_amount,
        goal.deadline || null,
        goal.icon || "🎯",
        goal.color || "#10B981",
        created_at,
      ],
    );

    await get().loadGoals();
    return id;
  },

  updateGoal: async (id, updates) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await db.runAsync(`UPDATE goals SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);

    await get().loadGoals();
  },

  deleteGoal: async (id) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM goal_transactions WHERE goal_id = ?", [id]);
    await db.runAsync("DELETE FROM goals WHERE id = ?", [id]);
    await get().loadGoals();
  },

  topupGoal: async (goalId, amount, note, walletId) => {
    const db = await getDatabase();
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    // Update goal current_amount
    const newAmount = goal.current_amount + amount;
    await db.runAsync("UPDATE goals SET current_amount = ? WHERE id = ?", [
      newAmount,
      goalId,
    ]);

    // Log goal transaction
    const txId = generateId("GTX");
    await db.runAsync(
      "INSERT INTO goal_transactions (id, goal_id, type, amount, note, wallet_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        txId,
        goalId,
        "topup",
        amount,
        note || "Topup",
        walletId,
        getCurrentTimestamp(),
      ],
    );

    // If wallet specified, create expense transaction
    if (walletId) {
      await get().addTransaction({
        date: getCurrentTimestamp().split("T")[0],
        type: "expense",
        category: "Tabungan",
        amount,
        note: `Topup Goal: ${goal.name}`,
        wallet_id: walletId,
      });
    }

    await get().loadGoals();
  },

  withdrawGoal: async (goalId, amount, note, walletId) => {
    const db = await getDatabase();
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal || amount > goal.current_amount) return;

    // Update goal current_amount
    const newAmount = goal.current_amount - amount;
    await db.runAsync("UPDATE goals SET current_amount = ? WHERE id = ?", [
      newAmount,
      goalId,
    ]);

    // Log goal transaction
    const txId = generateId("GTX");
    await db.runAsync(
      "INSERT INTO goal_transactions (id, goal_id, type, amount, note, wallet_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        txId,
        goalId,
        "withdraw",
        amount,
        note || "Withdraw",
        walletId,
        getCurrentTimestamp(),
      ],
    );

    // If wallet specified, create income transaction
    if (walletId) {
      await get().addTransaction({
        date: getCurrentTimestamp().split("T")[0],
        type: "income",
        category: "Pencairan Tabungan",
        amount,
        note: `Withdraw Goal: ${goal.name}`,
        wallet_id: walletId,
      });
    }

    await get().loadGoals();
  },

  getGoalTransactions: async (goalId, limit = 20, offset = 0) => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<GoalTransaction>(
      "SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [goalId, limit, offset],
    );
    return rows;
  },

  // =====================
  // WALLETS
  // =====================
  loadWallets: async () => {
    const db = await getDatabase();
    const wallets = await db.getAllAsync<Wallet>("SELECT * FROM wallets");
    const transactions = await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions",
    );

    // Calculate current balance for each wallet
    const walletBalances: Record<string, number> = {};
    transactions.forEach((tx) => {
      const wId = tx.wallet_id || "WALLET-CASH";
      walletBalances[wId] = walletBalances[wId] || 0;
      if (tx.type === "income") {
        walletBalances[wId] += tx.amount;
      } else {
        walletBalances[wId] -= tx.amount;
      }
    });

    const walletsWithBalance = wallets.map((w) => ({
      ...w,
      current_balance: w.initial_balance + (walletBalances[w.id] || 0),
    }));

    set({ wallets: walletsWithBalance });
  },

  addWallet: async (wallet) => {
    const db = await getDatabase();
    const id = generateId("WALLET");

    await db.runAsync(
      "INSERT INTO wallets (id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        wallet.name,
        wallet.type,
        wallet.initial_balance,
        wallet.icon || "💰",
        wallet.color || "#10B981",
      ],
    );

    await get().loadWallets();
    return id;
  },

  updateWallet: async (id, updates) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await db.runAsync(`UPDATE wallets SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);

    await get().loadWallets();
  },

  deleteWallet: async (id) => {
    const db = await getDatabase();
    // Check if wallet has transactions
    const txCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?",
      [id],
    );

    if (txCount && txCount.count > 0) {
      return false; // Can't delete wallet with transactions
    }

    await db.runAsync("DELETE FROM wallets WHERE id = ?", [id]);
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
}));
