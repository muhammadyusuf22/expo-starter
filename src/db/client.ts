/**
 * SQLite Database Client
 * Using expo-sqlite for local storage
 */

import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, DEFAULT_BUDGETS, DEFAULT_WALLETS } from "./schema";

const DB_NAME = "spenduit-lite.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

/**
 * Initialize database with tables and seed data
 */
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Create tables
  const statements = CREATE_TABLES_SQL.split(";").filter(
    (s) => s.trim().length > 0,
  );
  for (const statement of statements) {
    await database.execAsync(statement + ";");
  }

  // Seed default wallets if empty
  const wallets = await database.getAllAsync("SELECT id FROM wallets LIMIT 1");
  if (wallets.length === 0) {
    for (const wallet of DEFAULT_WALLETS) {
      await database.runAsync(
        "INSERT INTO wallets (id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
        [
          wallet.id,
          wallet.name,
          wallet.type,
          wallet.initial_balance,
          wallet.icon,
          wallet.color,
        ],
      );
    }
    console.log("[DB] Seeded default wallets");
  }

  // Seed default budgets if empty
  const budgets = await database.getAllAsync("SELECT id FROM budgets LIMIT 1");
  if (budgets.length === 0) {
    for (const budget of DEFAULT_BUDGETS) {
      await database.runAsync(
        "INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)",
        [budget.category, budget.monthly_limit],
      );
    }
    console.log("[DB] Seeded default budgets");
  }

  console.log("[DB] Database initialized");

  // Migration: Add transaction_id to goal_transactions if missing
  try {
    const tableInfo = await database.getAllAsync<any>(
      "PRAGMA table_info(goal_transactions)",
    );
    const hasTxId = tableInfo.some((col) => col.name === "transaction_id");

    if (!hasTxId) {
      console.log("[DB] Migrating: Adding transaction_id to goal_transactions");
      await database.execAsync(
        "ALTER TABLE goal_transactions ADD COLUMN transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE",
      );

      // Backfill using fuzzy match
      console.log("[DB] Migrating: Backfilling transaction_id");

      // Fetch all goal transactions without tx id (all of them since new column)
      const allGTs = await database.getAllAsync<any>(
        "SELECT * FROM goal_transactions",
      );

      for (const gt of allGTs) {
        // Find matching tx
        const typeCategory =
          gt.type === "topup" ? "Tabungan" : "Pencairan Tabungan";
        const tx = await database.getFirstAsync<any>(
          `SELECT id FROM transactions 
                  WHERE wallet_id = ? 
                  AND category = ?
                  AND created_at BETWEEN datetime(?, '-15 seconds') AND datetime(?, '+15 seconds')
                  LIMIT 1`,
          [gt.wallet_id, typeCategory, gt.created_at, gt.created_at],
        );
        if (tx) {
          await database.runAsync(
            "UPDATE goal_transactions SET transaction_id = ? WHERE id = ?",
            [tx.id, gt.id],
          );
        }
      }
      console.log("[DB] Migration complete");
    }
  } catch (err) {
    console.error("[DB] Migration failed", err);
  }
}

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Get current ISO date string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date for display (e.g., "17 Jan")
 */
export function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
