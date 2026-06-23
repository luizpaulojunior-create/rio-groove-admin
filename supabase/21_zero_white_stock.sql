-- Rio Groove — zerar estoque da cor White (color_key = wht)
-- Não altera Off White (off).
BEGIN;

UPDATE stock_items
SET quantity = 0
WHERE color_key = 'wht';

COMMIT;
