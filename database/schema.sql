-- ============================================================
-- Inventory Management System - PostgreSQL Schema
-- ============================================================

CREATE DATABASE inventory_db;
\c inventory_db;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for fuzzy search

-- ============================================================
-- LOCATIONS TABLE
-- ============================================================
CREATE TABLE locations (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    address     VARCHAR(255),
    type        VARCHAR(50) CHECK (type IN ('WAREHOUSE', 'STORE', 'OFFICE', 'FACTORY', 'OTHER')) DEFAULT 'WAREHOUSE',
    active      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ITEMS TABLE
-- ============================================================
CREATE TABLE items (
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    usage_context   TEXT,
    category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    unit            VARCHAR(50) DEFAULT 'units',
    unit_price      DECIMAL(12,2),
    reorder_level   INTEGER DEFAULT 10,
    max_stock_level INTEGER DEFAULT 1000,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(usage_context, '') || ' ' || coalesce(sku, ''))
    ) STORED
);

-- ============================================================
-- INVENTORY TABLE (stock levels per item per location)
-- ============================================================
CREATE TABLE inventory (
    id              BIGSERIAL PRIMARY KEY,
    item_id         BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id     BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_qty    INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    last_counted_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (item_id, location_id)
);

-- ============================================================
-- TRANSACTIONS TABLE (audit log of all stock movements)
-- ============================================================
CREATE TABLE inventory_transactions (
    id              BIGSERIAL PRIMARY KEY,
    item_id         BIGINT NOT NULL REFERENCES items(id),
    location_id     BIGINT NOT NULL REFERENCES locations(id),
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('REPLENISHMENT', 'USAGE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN')
    ),
    quantity        INTEGER NOT NULL,           -- positive = in, negative = out
    quantity_before INTEGER NOT NULL,
    quantity_after  INTEGER NOT NULL,
    reference_no    VARCHAR(100),
    notes           TEXT,
    performed_by    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_items_search ON items USING GIN (search_vector);
CREATE INDEX idx_items_category ON items (category_id);
CREATE INDEX idx_items_sku ON items (sku);
CREATE INDEX idx_inventory_item ON inventory (item_id);
CREATE INDEX idx_inventory_location ON inventory (location_id);
CREATE INDEX idx_transactions_item ON inventory_transactions (item_id);
CREATE INDEX idx_transactions_location ON inventory_transactions (location_id);
CREATE INDEX idx_transactions_type ON inventory_transactions (transaction_type);
CREATE INDEX idx_transactions_created ON inventory_transactions (created_at DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- Stock status view
CREATE VIEW v_stock_status AS
SELECT
    i.id          AS item_id,
    i.sku,
    i.name        AS item_name,
    i.unit,
    i.reorder_level,
    i.max_stock_level,
    c.name        AS category_name,
    l.id          AS location_id,
    l.name        AS location_name,
    inv.quantity,
    inv.reserved_qty,
    (inv.quantity - inv.reserved_qty) AS available_qty,
    CASE
        WHEN inv.quantity = 0                THEN 'OUT_OF_STOCK'
        WHEN inv.quantity <= i.reorder_level THEN 'LOW_STOCK'
        WHEN inv.quantity >= i.max_stock_level THEN 'OVERSTOCKED'
        ELSE 'IN_STOCK'
    END AS stock_status,
    inv.updated_at AS last_updated
FROM inventory inv
JOIN items i     ON inv.item_id = i.id
JOIN locations l ON inv.location_id = l.id
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.active = TRUE AND l.active = TRUE;

-- Summary view per item
CREATE VIEW v_item_summary AS
SELECT
    i.id, i.sku, i.name, i.unit, i.reorder_level,
    c.name AS category_name,
    COALESCE(SUM(inv.quantity), 0)      AS total_quantity,
    COALESCE(SUM(inv.reserved_qty), 0) AS total_reserved,
    COUNT(DISTINCT inv.location_id)    AS location_count,
    CASE
        WHEN COALESCE(SUM(inv.quantity), 0) = 0              THEN 'OUT_OF_STOCK'
        WHEN COALESCE(SUM(inv.quantity), 0) <= i.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS overall_status
FROM items i
LEFT JOIN inventory inv ON i.id = inv.item_id
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.active = TRUE
GROUP BY i.id, i.sku, i.name, i.unit, i.reorder_level, c.name;

-- ============================================================
-- TRIGGER: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_updated     BEFORE UPDATE ON items     FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO locations (name, description, type, address) VALUES
('Main Warehouse',   'Primary storage facility',          'WAREHOUSE', '100 Industrial Ave, Hyderabad'),
('North Store',      'Retail outlet - North campus',      'STORE',     '45 MG Road, Secunderabad'),
('South Store',      'Retail outlet - South campus',      'STORE',     '22 Banjara Hills Road, Hyderabad'),
('IT Office',        'Internal IT supplies depot',        'OFFICE',    'Floor 3, Cyber Towers, Hyderabad'),
('Assembly Factory', 'Manufacturing assembly facility',   'FACTORY',   '200 APIIC Zone, Patancheru');

INSERT INTO categories (name, description) VALUES
('Electronics',      'Electronic components and devices'),
('Stationery',       'Office stationery and supplies'),
('Safety Equipment', 'PPE and safety gear'),
('Furniture',        'Office and warehouse furniture'),
('Raw Materials',    'Manufacturing raw materials'),
('Consumables',      'Day-to-day consumable items');

INSERT INTO items (sku, name, description, usage_context, category_id, unit, unit_price, reorder_level, max_stock_level) VALUES
('EL-001', 'Laptop - Dell Inspiron 15',   'Dell Inspiron 15 3000 series laptop',          'Used by engineers and office staff for daily work', 1, 'units', 55000.00, 5, 50),
('EL-002', 'Wireless Mouse',              'Logitech M235 wireless optical mouse',          'Standard peripheral for workstations',              1, 'units', 1200.00,  10, 200),
('EL-003', 'USB-C Hub 7-in-1',            'Multi-port USB-C hub with HDMI and USB ports',  'Used with laptops lacking ports',                   1, 'units', 2500.00,  8, 100),
('ST-001', 'A4 Printer Paper (Ream)',     'JK Copier A4 80gsm 500 sheets ream',           'Printing documents and reports',                    2, 'reams', 350.00,   20, 500),
('ST-002', 'Blue Ballpoint Pen (Box)',    'Reynolds 045 blue pens, box of 10',             'General writing and signing documents',             2, 'boxes', 80.00,    15, 300),
('ST-003', 'Stapler Heavy Duty',          'Kangaro DP-480 heavy duty stapler',             'Binding documents in office use',                   2, 'units', 450.00,   5, 50),
('SF-001', 'Safety Helmet',              'HDPE hard hat - ISI certified white helmet',    'Mandatory PPE on factory floor and warehouse',      3, 'units', 350.00,   20, 150),
('SF-002', 'Safety Gloves (Pair)',        'Cut-resistant nitrile coated work gloves',      'Hand protection during material handling',          3, 'pairs', 120.00,   50, 500),
('SF-003', 'Fire Extinguisher 5kg',       'ABC dry powder fire extinguisher',             'Fire safety equipment for each zone',               3, 'units', 2200.00,  3, 30),
('FN-001', 'Office Chair Ergonomic',     'High-back mesh ergonomic office chair',         'Seating for office staff',                          4, 'units', 8500.00,  2, 30),
('RM-001', 'Copper Wire 1mm (kg)',        '99.9% pure copper wire, 1mm gauge',            'Used in electrical assembly manufacturing',         5, 'kg',    650.00,   50, 1000),
('CO-001', 'Hand Sanitizer 500ml',        'WHO-formula alcohol-based hand sanitizer',     'Hygiene consumable at entry points and desks',      6, 'bottles', 180.00,  30, 400);

-- Inventory (item_id, location_id, quantity)
INSERT INTO inventory (item_id, location_id, quantity) VALUES
(1,  1, 12), (1,  4, 5),  (1,  2, 3),
(2,  1, 80), (2,  4, 25), (2,  2, 15), (2, 3, 10),
(3,  1, 40), (3,  4, 12),
(4,  1, 200),(4,  2, 45), (4,  3, 30), (4, 4, 20),
(5,  1, 150),(5,  2, 20), (5,  3, 15),
(6,  1, 18), (6,  2, 4),  (6,  3, 3),
(7,  1, 60), (7,  5, 35),
(8,  1, 200),(8,  5, 80),
(9,  1, 8),  (9,  5, 4),  (9,  2, 2),
(10, 1, 6),  (10, 4, 3),
(11, 5, 380),(11, 1, 120),
(12, 1, 200),(12, 2, 40), (12, 3, 35), (12, 4, 25), (12, 5, 50);

-- Sample transactions
INSERT INTO inventory_transactions (item_id, location_id, transaction_type, quantity, quantity_before, quantity_after, reference_no, notes, performed_by) VALUES
(1, 1, 'REPLENISHMENT', 5,  7,  12, 'PO-2024-001', 'Monthly laptop replenishment', 'admin'),
(4, 1, 'USAGE',        -50, 250, 200, 'REQ-2024-055', 'Monthly printing supplies issued', 'storekeeper'),
(8, 5, 'USAGE',        -20, 100, 80, 'REQ-2024-060', 'Factory floor gloves issued', 'safety_officer'),
(2, 1, 'REPLENISHMENT', 30, 50, 80, 'PO-2024-010', 'Quarterly mouse stock', 'admin'),
(12,1, 'USAGE',        -30, 230, 200,'REQ-2024-070','Sanitizer distributed to floors','admin');
