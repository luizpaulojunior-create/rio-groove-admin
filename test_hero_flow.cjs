require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cvpobvvkhcqasumhfwps.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iR4bqbFa6WUtG5o1EOQUwQ_AETsl9S1';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    console.log('1. Authenticating (creating test user)...');
    const testEmail = `test_admin_${Date.now()}@riogroove.com`;
    let { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    });

    if (authError || !authData.session) {
      console.log('SignUp failed or no session, trying to login with an existing test user or bypass...');
      // If signup fails (maybe user exists or signup disabled), try to login if we know one, or just proceed without token if backend allows
      const res = await supabase.auth.signInWithPassword({ email: testEmail, password: 'testpassword123' });
      if (res.error) throw res.error;
      authData = res.data;
    }
    const token = authData.session.access_token;
    console.log('✅ Authenticated successfully.');

    console.log('\n2. Testing image upload to backend...');
    
    // Check for test_image.jpg which is already in the directory
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('Criando imagem de teste...');
      fs.writeFileSync(testImagePath, 'fake image content');
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath));
    form.append('bucket', 'product-images');
    form.append('path', 'storefront/hero');

    const apiUrl = process.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api';
    const uploadRes = await axios.post(
      `${apiUrl}/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Upload response:', uploadRes.data);
    const imageUrl = uploadRes.data.url;

    console.log('\n3. Testing DB persistence in storefront_sections...');
    const heroPayload = {
      type: 'hero',
      content: {
        slides: [
          {
            headline_part1: 'VISTA O QUE',
            headline_part2: 'VOCÊ CARREGA',
            subtitle: 'Test script subtitle',
            cta_text: 'VER COLEÇÕES',
            cta_link: '/collections',
            image_url: imageUrl,
            image_url_mobile: imageUrl
          }
        ],
        autoplay: true,
        autoplay_interval: 5000
      },
      active: true,
      order_index: 10,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase.from('storefront_sections').select('id').eq('type', 'hero').maybeSingle();
    
    let dbRes;
    if (existing) {
      dbRes = await supabase.from('storefront_sections').update(heroPayload).eq('id', existing.id).select();
    } else {
      dbRes = await supabase.from('storefront_sections').insert([heroPayload]).select();
    }

    if (dbRes.error) throw dbRes.error;
    console.log('✅ DB Persistence successful:', dbRes.data[0].id);

    console.log('\n4. Testing rendering data fetch...');
    const { data: fetchRes, error: fetchErr } = await supabase.from('storefront_sections').select('*').eq('type', 'hero').single();
    if (fetchErr) throw fetchErr;
    console.log('✅ Data fetched for render, imageUrl:', fetchRes.content.slides[0].image_url);

    console.log('\n🚀 Flow test completed successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message || err);
  }
}

runTest();
