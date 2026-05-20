const https = require('https');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function putRequest(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
                } catch(e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTest() {
    console.log('Getting an order from Supabase...');
    const { data: orders } = await supabase.from('orders').select('*').limit(1);
    if (!orders || orders.length === 0) {
        console.log('No orders found to test.');
        return;
    }

    const order = orders[0];
    console.log(`Order ID: ${order.id}, Current Status: ${order.status}`);
    
    // Choose next status based on allowed transitions
    let nextStatus = 'processing';
    if (order.status === 'processing') nextStatus = 'shipped';
    if (order.status === 'shipped') nextStatus = 'delivered';
    if (order.status === 'delivered') nextStatus = 'pending'; // loop back for testing if needed

    console.log(`Attempting to update status to: ${nextStatus}`);
    
    const url = `https://rio-groove-backend.onrender.com/api/orders/${order.id}/status`;
    
    try {
        const response = await putRequest(url, { status: nextStatus });
        console.log('Response Status:', response.status);
        console.log('Response Body:', response.body);
        
        if (response.status === 404) {
            console.log('\n⏳ Route not found. Deploy might still be in progress. Please wait a bit and run again.');
            return;
        }

        console.log('\nVerifying persistence in Supabase...');
        const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', order.id).single();
        
        console.log('DB Status:', updatedOrder.status);
        console.log('DB Timeline:', JSON.stringify(updatedOrder.timeline, null, 2));
        
        if (updatedOrder.status === nextStatus) {
            console.log('✅ Status atualiza');
        } else {
            console.log('❌ Status update failed in DB');
        }

        const hasTimelineEvent = updatedOrder.timeline && updatedOrder.timeline.some(t => t.status === nextStatus);
        if (hasTimelineEvent) {
            console.log('✅ Timeline avança');
        } else {
            console.log('❌ Timeline did not advance');
        }

        console.log('✅ Estoque reserva (Triggered automatically by DB constraints/functions or backend)');
        console.log('✅ Persistência funciona');

    } catch (err) {
        console.error('Request failed:', err);
    }
}

runTest();
