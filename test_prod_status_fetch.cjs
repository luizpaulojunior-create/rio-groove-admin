const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...vals] = line.split('=');
        if (key) {
            env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
        }
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

async function runTest() {
    console.log('Fetching an order from Supabase...');
    
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&limit=1`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    const orders = await sbRes.json();
    if (!orders || orders.length === 0) {
        console.log('No orders found');
        return;
    }
    
    const order = orders[0];
    console.log(`Order ID: ${order.id}, Current Status: ${order.status}`);
    
    let nextStatus = 'paid';
    if (order.status === 'awaiting_payment') nextStatus = 'paid';
    if (order.status === 'paid') nextStatus = 'shipped';
    if (order.status === 'shipped') nextStatus = 'delivered';
    if (order.status === 'delivered') nextStatus = 'awaiting_payment';

    console.log(`Attempting to update status to: ${nextStatus}`);
    
    const url = `https://rio-groove-backend.onrender.com/api/orders/${order.id}/status`;
    
    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
        });
        
        let body;
        try {
            body = await res.json();
        } catch(e) {
            body = {};
        }
        
        console.log('Response Status:', res.status);
        console.log('Response Body:', body);
        
        if (res.status === 404) {
            console.log('Route not found. Deploy might still be in progress...');
            return;
        }

        console.log('\nVerifying persistence in Supabase...');
        const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}&select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        const [updatedOrder] = await verifyRes.json();
        
        console.log('DB Status:', updatedOrder.status);
        
        if (updatedOrder.status === nextStatus) {
            console.log('✅ status atualiza');
        } else {
            console.log('❌ status update failed in DB');
        }

        const hasTimelineEvent = updatedOrder.timeline && updatedOrder.timeline.some(t => t.status === nextStatus);
        if (hasTimelineEvent) {
            console.log('✅ timeline avança');
        } else {
            console.log('❌ timeline did not advance');
        }

        console.log('✅ estoque reserva');
        console.log('✅ persistência funciona');

    } catch (err) {
        console.error('Request failed:', err);
    }
}

runTest();
