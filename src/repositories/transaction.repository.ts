import { getDatabase } from "@/db/client";
import { Transaction } from "@/db/schema";

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  walletId?: string;
}

export const TransactionRepository = {
  create: async (tx: Transaction) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO transactions (id, date, type, category, amount, note, wallet_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        tx.id,
        tx.date,
        tx.type,
        tx.category,
        tx.amount,
        tx.note,
        tx.wallet_id,
        tx.created_at,
      ],
    );
    return tx.id;
  },

  update: async (id: string, updates: Partial<Transaction>) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates);

    if (fields.length === 0) return;

    await db.runAsync(`UPDATE transactions SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  delete: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  },

  findById: async (id: string) => {
    const db = await getDatabase();
    return db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?",
      [id],
    );
  },

  findAll: async (
    limit: number = 20,
    offset: number = 0,
    filters?: TransactionFilters,
  ) => {
    const db = await getDatabase();
    let query = "SELECT * FROM transactions WHERE 1=1";
    const params: any[] = [];

    if (filters?.startDate && filters?.endDate) {
      query += " AND date BETWEEN ? AND ?";
      params.push(filters.startDate, filters.endDate);
    }

    if (filters?.walletId) {
      query += " AND wallet_id = ?";
      params.push(filters.walletId);
    }

    query += " ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return db.getAllAsync<Transaction>(query, params);
  },

  /**
   * Get All transactions without pagination (used for Store state loading)
   */
  getAll: async () => {
    const db = await getDatabase();
    return db.getAllAsync<Transaction>(
      "SELECT * FROM transactions ORDER BY date DESC, created_at DESC",
    );
  },
};
