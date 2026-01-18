import { getDatabase } from "@/db/client";
import { Wallet } from "@/db/schema";

export const WalletRepository = {
  findAll: async () => {
    const db = await getDatabase();
    return db.getAllAsync<Wallet>(
      `SELECT w.*, 
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as current_balance
       FROM wallets w
       LEFT JOIN transactions t ON t.wallet_id = w.id
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
    );
  },

  create: async (wallet: Wallet) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO wallets (id, name, type, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        wallet.id,
        wallet.name,
        wallet.type,
        wallet.icon,
        wallet.color,
        wallet.created_at,
      ],
    );
  },

  delete: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM wallets WHERE id = ?", [id]);
  },

  update: async (id: string, updates: Partial<Wallet>) => {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates);
    if (fields.length === 0) return;
    await db.runAsync(`UPDATE wallets SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },
};
