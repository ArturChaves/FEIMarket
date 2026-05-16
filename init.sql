CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('client', 'admin');

-- ============================================================
-- TABELA: users
-- Dados cadastrais dos usuários do marketplace
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'client',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    balance         DECIMAL(12, 2) NOT NULL DEFAULT 1000.00,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ============================================================
-- TABELA: orders
-- Pedidos realizados no marketplace
-- ============================================================

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID NOT NULL REFERENCES users(id),
    total           DECIMAL(12, 2) NOT NULL CHECK (total > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- ============================================================
-- TABELA: order_items
-- Itens de cada pedido (referência ao product_id do MongoDB)
-- ============================================================

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id        UUID REFERENCES users(id),
    product_id      VARCHAR(24) NOT NULL,   -- id do objeto do mongo
    product_name    VARCHAR(255) NOT NULL,   -- nome no momento da compra do produto
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(12, 2) NOT NULL CHECK (unit_price > 0),
    subtotal        DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

-- ============================================================
-- TABELA: transactions
-- ============================================================

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID REFERENCES users(id),
    seller_id        UUID REFERENCES users(id),
    order_item_id   UUID REFERENCES order_items(id),
    amount          DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
