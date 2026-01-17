import { getDatabase } from "@/db/client";
import { Goal, GoalTransaction } from "@/db/schema";

// Enforce Integer Precision by rounding values
const money = (val: number) => Math.round(val);

export const GoalRepository = {
  findAll: async () => {
    const db = await getDatabase();
    // Computed current_amount from transactions
    return db.getAllAsync<Goal>(
      `SELECT g.*, 
       COALESCE(SUM(CASE WHEN gt.type = 'topup' THEN gt.amount ELSE -gt.amount END), 0) as current_amount
       FROM goals g
       LEFT JOIN goal_transactions gt ON gt.goal_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
    );
  },

  findById: async (id: string) => {
    const db = await getDatabase();
    return db.getFirstAsync<Goal>(
      `SELECT g.*, 
       COALESCE(SUM(CASE WHEN gt.type = 'topup' THEN gt.amount ELSE -gt.amount END), 0) as current_amount
       FROM goals g
       LEFT JOIN goal_transactions gt ON gt.goal_id = g.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [id],
    );
  },

  create: async (goal: Goal) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO goals (id, name, target_amount, deadline, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        goal.id,
        goal.name,
        money(goal.target_amount),
        goal.deadline,
        goal.icon,
        goal.color,
        goal.created_at,
      ],
    );
  },

  update: async (id: string, updates: Partial<Goal>) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");

    // Enforce Integer for numeric fields
    const values = Object.entries(updates).map(([k, v]) => {
      if (
        typeof v === "number" &&
        (k === "target_amount" || k === "current_amount")
      )
        return money(v);
      return v;
    });

    if (fields.length === 0) return;
    await db.runAsync(`UPDATE goals SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  delete: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM goals WHERE id = ?", [id]);
  },
};

export const GoalTransactionRepository = {
  findByGoalId: async (goalId: string, limit: number, offset: number) => {
    const db = await getDatabase();
    return db.getAllAsync<GoalTransaction>(
      "SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [goalId, limit, offset],
    );
  },

  findById: async (id: string) => {
    const db = await getDatabase();
    return db.getFirstAsync<GoalTransaction>(
      "SELECT * FROM goal_transactions WHERE id = ?",
      [id],
    );
  },

  findByTransactionId: async (txId: string) => {
    const db = await getDatabase();
    return db.getFirstAsync<GoalTransaction>(
      "SELECT * FROM goal_transactions WHERE transaction_id = ?",
      [txId],
    );
  },

  findByFuzzy: async (walletId: string, type: string, timestamp: string) => {
    const db = await getDatabase();
    return db.getFirstAsync<GoalTransaction>(
      `SELECT * FROM goal_transactions 
             WHERE wallet_id = ? 
             AND type = ?
             AND created_at BETWEEN datetime(?, '-10 seconds') AND datetime(?, '+10 seconds')
             LIMIT 1`,
      [walletId, type, timestamp, timestamp],
    );
  },

  create: async (gtx: GoalTransaction) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO goal_transactions (id, goal_id, type, amount, note, wallet_id, created_at, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        gtx.id,
        gtx.goal_id,
        gtx.type,
        money(gtx.amount),
        gtx.note,
        gtx.wallet_id,
        gtx.created_at,
        gtx.transaction_id,
      ],
    );
  },

  update: async (id: string, updates: Partial<GoalTransaction>) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");

    // Enforce Integer
    const values = Object.entries(updates).map(([k, v]) => {
      if (typeof v === "number" && k === "amount") return money(v);
      return v;
    });

    if (fields.length === 0) return;
    await db.runAsync(`UPDATE goal_transactions SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  delete: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM goal_transactions WHERE id = ?", [id]);
  },

  deleteByGoalId: async (goalId: string) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM goal_transactions WHERE goal_id = ?", [
      goalId,
    ]);
  },
};
