import { pool } from '../config/postgres';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: string;
  avatar_url: string | null;
}

export interface UserAuthRow extends UserRow {
  password_hash: string;
  is_active: boolean;
}

export interface PostgresStats {
  users:  { total: number; active: number };
  orders: { total: number; total_revenue: number; products_sold: number };
}

export const userRepository = {
  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, name, email, role, balance, avatar_url FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return rows[0] ?? null;
  },

  async findByEmail(email: string): Promise<UserAuthRow | null> {
    const { rows } = await pool.query<UserAuthRow>(
      'SELECT id, name, email, role, balance, avatar_url, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    return rows[0] ?? null;
  },

  async findSellerName(id: string): Promise<string | null> {
    const { rows } = await pool.query<{ name: string }>(
      'SELECT name FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return rows[0]?.name ?? null;
  },

  async create(name: string, email: string, passwordHash: string): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, balance, avatar_url',
      [name, email, passwordHash]
    );
    if (!rows[0]) throw new Error('Falha ao criar usuário');
    return rows[0];
  },

  async update(id: string, fields: { name?: string; email?: string; password_hash?: string }): Promise<UserRow | null> {
    const setClauses: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;
    if (fields.name)  { setClauses.push(`name = $${idx++}`);  values.push(fields.name); }
    if (fields.email) { setClauses.push(`email = $${idx++}`); values.push(fields.email); }
    if (fields.password_hash) { setClauses.push(`password_hash = $${idx++}`); values.push(fields.password_hash); }
    setClauses.push('updated_at = NOW()');
    values.push(id);
    const { rows } = await pool.query<UserRow>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} AND is_active = TRUE RETURNING id, name, email, role, balance, avatar_url`,
      values
    );
    return rows[0] ?? null;
  },

  async addBalance(id: string, amount: number): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND is_active = TRUE RETURNING id, name, email, role, balance, avatar_url',
      [amount, id]
    );
    return rows[0] ?? null;
  },

  async updateAvatarUrl(id: string, avatarUrl: string): Promise<void> {
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, id]
    );
  },

  async getPostgresStats(): Promise<PostgresStats> {
    const [usersRes, ordersRes] = await Promise.all([
      pool.query<{ total: string; active: string }>(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active) AS active FROM users
      `),
      pool.query<{ total_orders: string; total_revenue: string; products_sold: string }>(`
        SELECT COUNT(DISTINCT o.id)        AS total_orders,
               COALESCE(SUM(o.total), 0)   AS total_revenue,
               COALESCE(SUM(oi.quantity), 0) AS products_sold
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
      `),
    ]);
    const u = usersRes.rows[0]!;
    const o = ordersRes.rows[0]!;
    return {
      users:  { total: parseInt(u.total, 10), active: parseInt(u.active, 10) },
      orders: { total: parseInt(o.total_orders, 10), total_revenue: parseFloat(o.total_revenue), products_sold: parseInt(o.products_sold, 10) },
    };
  },
};
