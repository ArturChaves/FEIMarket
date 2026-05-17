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

  async getRecentActivity() {
    const [loginRes, viewRes, purchaseRes] = await Promise.all([
      cassandra.execute('SELECT user_id, logged_at, ip_address, device FROM marketplace.login_history LIMIT 50', [], { prepare: true }).catch(() => ({ rows: [] })),
      cassandra.execute('SELECT user_id, viewed_at, product_name, price FROM marketplace.product_views LIMIT 50', [], { prepare: true }).catch(() => ({ rows: [] })),
      cassandra.execute('SELECT user_id, purchased_at, product_name, quantity, total FROM marketplace.purchase_history LIMIT 50', [], { prepare: true }).catch(() => ({ rows: [] })),
    ]);

    const last_logins = loginRes.rows.map(row => ({
      user_id: row['user_id'] ? row['user_id'].toString() : '',
      logged_at: row['logged_at'] ? new Date(row['logged_at']).toISOString() : new Date().toISOString(),
      ip_address: row['ip_address'] ?? 'N/A',
      device: row['device'] ?? 'N/A'
    })).sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 10);

    const last_views = viewRes.rows.map(row => ({
      user_id: row['user_id'] ? row['user_id'].toString() : '',
      product_name: row['product_name'] ?? 'N/A',
      price: row['price'] ? parseFloat(row['price'].toString()) : 0,
      viewed_at: row['viewed_at'] ? new Date(row['viewed_at']).toISOString() : new Date().toISOString()
    })).sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()).slice(0, 10);

    const last_purchases = purchaseRes.rows.map(row => ({
      user_id: row['user_id'] ? row['user_id'].toString() : '',
      product_name: row['product_name'] ?? 'N/A',
      quantity: row['quantity'] ?? 0,
      total: row['total'] ? parseFloat(row['total'].toString()) : 0,
      purchased_at: row['purchased_at'] ? new Date(row['purchased_at']).toISOString() : new Date().toISOString()
    })).sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()).slice(0, 10);

    return {
      last_logins,
      last_views,
      last_purchases
    };
  },
};
