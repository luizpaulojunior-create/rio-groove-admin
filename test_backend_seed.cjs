const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rio-groove-backend-final/rio-groove-backend/.env') });

process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost';
process.env.MERCADO_PAGO_PUBLIC_KEY = process.env.MERCADO_PAGO_PUBLIC_KEY || 'test';
process.env.MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'test';

const { seedStockItems } = require('../rio-groove-backend-final/rio-groove-backend/src/services/stock.service.js');

async function test() {
    try {
        console.log("Executando 1ª vez...");
        const res1 = await seedStockItems();
        console.log(res1);

        console.log("\nExecutando 2ª vez (Idempotência)...");
        const res2 = await seedStockItems();
        console.log(res2);
        
        // Deletando 2 itens para testar re-inserção
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const { data } = await supabase.from('stock_items').select('id').limit(2);
        const ids = data.map(d => d.id);
        
        if (ids.length > 0) {
            console.log(`\nDeletando ${ids.length} itens...`);
            await supabase.from('stock_items').delete().in('id', ids);
            
            console.log("\nExecutando 3ª vez (Apenas faltantes)...");
            const res3 = await seedStockItems();
            console.log(res3);
        }

        console.log("\nVerificando total no banco...");
        const { count } = await supabase.from('stock_items').select('*', { count: 'exact', head: true });
        console.log(`Total de registros: ${count} (esperado 30)`);

    } catch (e) {
        console.error("Erro:", e);
    }
}

test();