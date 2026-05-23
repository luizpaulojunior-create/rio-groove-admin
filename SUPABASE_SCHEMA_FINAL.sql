-- 1. Create table `collections` if not exists
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    thumbnail_url TEXT,
    mobile_banner_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist in case table already exists
ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Add collection_id and active to `products`
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Add Foreign Key for collection_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_collection') THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_collection
            FOREIGN KEY (collection_id) REFERENCES collections(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(active);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 5. Update existing products and collections to active=true just in case
UPDATE collections SET active = true WHERE active IS NULL;
UPDATE products SET active = true WHERE active IS NULL;

-- 6. Create stock_items table for new master stock architecture
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    color_key TEXT NOT NULL,
    color_label TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    size TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(model, color_key, size)
);

CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON stock_items(sku);
CREATE INDEX IF NOT EXISTS idx_stock_items_category_model ON stock_items(category, model);
