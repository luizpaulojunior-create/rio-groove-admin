const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .limit(1);
    
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  
  if (!orders || orders.length === 0) return;
  
  const orderId = orders[0].id;
  const originalStatus = orders[0].status;
  
  const statusesToTest = [
    'created', 'pending', 'pending_payment', 'paid', 'approved', 
    'reserved', 'in_process', 'in_mediation', 'rejected', 'refunded', 
    'completed', 'delivered', 'shipped', 'shipping', 'transit', 
    'postado', 'em_transito', 'entregue'
  ];
  
  const allowed = [];
  
  for (const st of statusesToTest) {
    const { error } = await supabase
      .from('orders')
      .update({ status: st })
      .eq('id', orderId);
      
    if (!error) {
      allowed.push(st);
      await supabase.from('orders').update({ status: originalStatus }).eq('id', orderId);
    }
  }
  
  console.log('Allowed statuses:', allowed);
}

test();
