import { types } from 'cassandra-driver';
import { cassandra } from '../config/cassandra';

export const cassandraRepository = {
  async insertLogin(userId: types.Uuid, ip: string, device: string): Promise<void> {
    await cassandra.execute(
      `INSERT INTO marketplace.login_history (user_id, logged_at, login_id, ip_address, device)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, new Date(), types.Uuid.random(), ip, device],
      { prepare: true }
    );
  },

  async insertView(
    userId: types.Uuid, productId: string, productName: string, price: number
  ): Promise<void> {
    await cassandra.execute(
      `INSERT INTO marketplace.product_views (user_id, viewed_at, view_id, product_id, product_name, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, new Date(), types.Uuid.random(), productId, productName, price],
      { prepare: true }
    );
  },

  async insertPurchase(
    userId: types.Uuid, orderId: string, productId: string,
    productName: string, quantity: number, total: number
  ): Promise<void> {
    await cassandra.execute(
      `INSERT INTO marketplace.purchase_history
       (user_id, purchased_at, purchase_id, order_id, product_id, product_name, quantity, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, new Date(), types.Uuid.random(), orderId, productId, productName, quantity, total],
      { prepare: true }
    );
  },

  async getLastLogin(userId: types.Uuid) {
    const result = await cassandra.execute(
      'SELECT * FROM marketplace.login_history WHERE user_id = ? LIMIT 1',
      [userId],
      { prepare: true }
    );
    return result.rows[0] ?? null;
  },

  async getLastView(userId: types.Uuid) {
    const result = await cassandra.execute(
      'SELECT * FROM marketplace.product_views WHERE user_id = ? LIMIT 1',
      [userId],
      { prepare: true }
    );
    return result.rows[0] ?? null;
  },

  async getLastPurchase(userId: types.Uuid) {
    const result = await cassandra.execute(
      'SELECT * FROM marketplace.purchase_history WHERE user_id = ? LIMIT 1',
      [userId],
      { prepare: true }
    );
    return result.rows[0] ?? null;
  },

  async countAll(): Promise<{ total_logins: number; total_views: number; total_purchases: number }> {
    const [loginRes, viewRes, purchaseRes] = await Promise.all([
      cassandra.execute('SELECT COUNT(*) FROM marketplace.login_history',    [], { prepare: true }),
      cassandra.execute('SELECT COUNT(*) FROM marketplace.product_views',    [], { prepare: true }),
      cassandra.execute('SELECT COUNT(*) FROM marketplace.purchase_history', [], { prepare: true }),
    ]);
    return {
      total_logins:    loginRes.rows[0]    ? Number(loginRes.rows[0]!['count'])    : 0,
      total_views:     viewRes.rows[0]     ? Number(viewRes.rows[0]!['count'])     : 0,
      total_purchases: purchaseRes.rows[0] ? Number(purchaseRes.rows[0]!['count']) : 0,
    };
  },
};
