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
  
  if (!orders || orders.length === 0) {
    console.log('No orders found.');
    return;
  }
  
  const orderId = orders[0].id;
  const originalStatus = orders[0].status;
  console.log(`Original order ${orderId} status: ${originalStatus}`);
  
  const statusesToTest = ['reserved', 'estoque_reservado', 'processing', 'preparando', 'shipped', 'cancelled', 'em_producao', 'aguardando_producao'];
  
  for (const st of statusesToTest) {
    console.log(`\nTrying to update to '${st}'`);
    const { error: updateError, data } = await supabase
      .from('orders')
      .update({ status: st })
      .eq('id', orderId)
      .select();
      
    if (updateError) {
      console.log(`Update to ${st} FAILED:`, updateError.message);
    } else {
      console.log(`Update to ${st} SUCCESSFUL!`);
      // Revert immediately
      await supabase.from('orders').update({ status: originalStatus }).eq('id', orderId);
    }
  }
}

test();
