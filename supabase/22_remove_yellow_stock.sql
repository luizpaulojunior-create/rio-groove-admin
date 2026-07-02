-- Rio Groove — remover todos os SKUs amarelos (color_key = yel) do estoque
BEGIN;

DELETE FROM stock_items
WHERE color_key = 'yel';

COMMIT;
