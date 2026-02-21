-- Shopee Orders & Escrow - Migration
-- Run in Supabase Dashboard > SQL Editor
-- Depends on: shopee_tokens table (already exists)

-- ============================================
-- 1. SHOPEE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS shopee_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_sn TEXT NOT NULL,
  shop_id BIGINT NOT NULL,
  order_status TEXT NOT NULL,
  -- buyer
  buyer_user_id BIGINT,
  buyer_username TEXT,
  -- amounts
  total_amount NUMERIC(12,2),
  actual_shipping_fee NUMERIC(12,2) DEFAULT 0,
  buyer_paid NUMERIC(12,2) DEFAULT 0,
  seller_discount NUMERIC(12,2) DEFAULT 0,
  shopee_discount NUMERIC(12,2) DEFAULT 0,
  voucher_from_seller NUMERIC(12,2) DEFAULT 0,
  voucher_from_shopee NUMERIC(12,2) DEFAULT 0,
  coins NUMERIC(12,2) DEFAULT 0,
  -- logistics
  shipping_carrier TEXT,
  tracking_number TEXT,
  estimated_shipping_fee NUMERIC(12,2) DEFAULT 0,
  -- payment
  payment_method TEXT,
  -- timestamps (Shopee sends unix epoch)
  create_time BIGINT,
  update_time BIGINT,
  pay_time BIGINT,
  ship_by_date BIGINT,
  days_to_ship INT,
  -- items stored as JSONB array
  items JSONB DEFAULT '[]'::jsonb,
  -- raw response for debugging
  raw_detail JSONB,
  -- meta
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_sn, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_shopee_orders_shop_status
  ON shopee_orders (shop_id, order_status);

CREATE INDEX IF NOT EXISTS idx_shopee_orders_create_time
  ON shopee_orders (shop_id, create_time DESC);

CREATE INDEX IF NOT EXISTS idx_shopee_orders_sn
  ON shopee_orders (order_sn);

-- ============================================
-- 2. SHOPEE ESCROW (financial details)
-- ============================================
CREATE TABLE IF NOT EXISTS shopee_escrow (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_sn TEXT NOT NULL,
  shop_id BIGINT NOT NULL,
  -- escrow amounts
  order_income NUMERIC(12,2),
  buyer_total_amount NUMERIC(12,2),
  original_price NUMERIC(12,2),
  seller_discount NUMERIC(12,2) DEFAULT 0,
  shopee_discount NUMERIC(12,2) DEFAULT 0,
  voucher_from_seller NUMERIC(12,2) DEFAULT 0,
  voucher_from_shopee NUMERIC(12,2) DEFAULT 0,
  coins NUMERIC(12,2) DEFAULT 0,
  buyer_paid_shipping_fee NUMERIC(12,2) DEFAULT 0,
  -- fees
  commission_fee NUMERIC(12,2) DEFAULT 0,
  service_fee NUMERIC(12,2) DEFAULT 0,
  transaction_fee NUMERIC(12,2) DEFAULT 0,
  -- seller payout
  escrow_amount NUMERIC(12,2),
  -- escrow tax (Brazil)
  escrow_tax NUMERIC(12,2) DEFAULT 0,
  -- raw
  raw_escrow JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_sn, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_shopee_escrow_shop
  ON shopee_escrow (shop_id);

-- ============================================
-- 3. SYNC LOG
-- ============================================
CREATE TABLE IF NOT EXISTS shopee_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id BIGINT NOT NULL,
  sync_type TEXT NOT NULL, -- 'orders', 'escrow', 'full'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'error'
  orders_fetched INT DEFAULT 0,
  orders_upserted INT DEFAULT 0,
  escrow_fetched INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX IF NOT EXISTS idx_shopee_sync_log_shop
  ON shopee_sync_log (shop_id, started_at DESC);

-- ============================================
-- 4. VIEWS
-- ============================================

-- Dashboard summary per shop
CREATE OR REPLACE VIEW shopee_dashboard_summary AS
SELECT
  o.shop_id,
  t.shop_name,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'COMPLETED') AS completed_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'SHIPPED') AS shipped_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'IN_CANCEL') AS cancelled_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'READY_TO_SHIP') AS ready_to_ship_orders,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status IN ('COMPLETED','SHIPPED','READY_TO_SHIP','PROCESSED')), 0) AS total_revenue,
  COALESCE(SUM(e.commission_fee), 0) AS total_commission,
  COALESCE(SUM(e.service_fee), 0) AS total_service_fee,
  COALESCE(SUM(e.escrow_amount), 0) AS total_seller_payout,
  COALESCE(AVG(o.total_amount) FILTER (WHERE o.order_status = 'COMPLETED'), 0) AS avg_ticket,
  MIN(o.create_time) AS oldest_order_ts,
  MAX(o.create_time) AS newest_order_ts
FROM shopee_orders o
LEFT JOIN shopee_tokens t ON t.shop_id = o.shop_id
LEFT JOIN shopee_escrow e ON e.order_sn = o.order_sn AND e.shop_id = o.shop_id
GROUP BY o.shop_id, t.shop_name;

-- Daily orders aggregation
CREATE OR REPLACE VIEW shopee_daily_orders AS
SELECT
  o.shop_id,
  t.shop_name,
  TO_CHAR(TO_TIMESTAMP(o.create_time) AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS order_date,
  COUNT(*) AS order_count,
  COALESCE(SUM(o.total_amount), 0) AS daily_revenue,
  COALESCE(AVG(o.total_amount), 0) AS avg_ticket,
  COUNT(DISTINCT o.buyer_user_id) AS unique_buyers
FROM shopee_orders o
LEFT JOIN shopee_tokens t ON t.shop_id = o.shop_id
GROUP BY o.shop_id, t.shop_name, TO_CHAR(TO_TIMESTAMP(o.create_time) AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
ORDER BY order_date DESC;

-- ============================================
-- 5. RLS
-- ============================================
ALTER TABLE shopee_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopee_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopee_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON shopee_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON shopee_escrow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON shopee_sync_log FOR ALL USING (true) WITH CHECK (true);
