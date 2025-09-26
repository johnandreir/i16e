#!/usr/bin/env node

async function checkAPIStatus() {
  try {
    console.log('🔍 Checking API debug endpoint...');
    const response = await fetch('http://localhost:3001/api/debug/routes');
    const data = await response.json();
    
    console.log('🗂️ API Response Status:', response.status);
    console.log('📊 Database Status:', JSON.stringify(data.databaseStatus, null, 2));
    console.log('⏰ Timestamp:', data.timestamp);
    
    // Try a simple DPE GET request
    console.log('\n🔍 Checking DPE endpoint...');
    const dpeResponse = await fetch('http://localhost:3001/api/dpe');
    console.log('📋 DPE Response Status:', dpeResponse.status);
    
    if (dpeResponse.ok) {
      const dpeData = await dpeResponse.json();
      console.log('📝 DPE Count:', dpeData.length);
    } else {
      const errorText = await dpeResponse.text();
      console.log('❌ DPE Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAPIStatus();