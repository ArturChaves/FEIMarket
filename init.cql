CREATE KEYSPACE IF NOT EXISTS marketplace
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS marketplace.product_views (
  user_id      uuid,
  viewed_at    timestamp,
  view_id      uuid,
  product_id   text,
  product_name text,
  price        decimal,
  PRIMARY KEY ((user_id), viewed_at, view_id)
) WITH CLUSTERING ORDER BY (viewed_at DESC, view_id DESC);

CREATE TABLE IF NOT EXISTS marketplace.login_history (
  user_id    uuid,
  logged_at  timestamp,
  login_id   uuid,
  ip_address text,
  device     text,
  PRIMARY KEY ((user_id), logged_at, login_id)
) WITH CLUSTERING ORDER BY (logged_at DESC, login_id DESC);

CREATE TABLE IF NOT EXISTS marketplace.purchase_history (
  user_id      uuid,
  purchased_at timestamp,
  purchase_id  uuid,
  order_id     text,
  product_id   text,
  product_name text,
  quantity     int,
  total        decimal,
  PRIMARY KEY ((user_id), purchased_at, purchase_id)
) WITH CLUSTERING ORDER BY (purchased_at DESC, purchase_id DESC);
