ALTER TABLE collections ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_collection') THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_collection
            FOREIGN KEY (collection_id) REFERENCES collections(id)
            ON DELETE SET NULL;
    END IF;
END $$;
