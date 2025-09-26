#!/usr/bin/env node
/**
 * Debug Frontend N8N Status Display
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function debugFrontendDisplay() {
  console.log('🔍 Debug Frontend N8N Status Display');
  console.log('=' .repeat(50));

  try {
    const response = await makeRequest('/api/health');
    
    if (response.n8nHealth) {
      const n8nHealth = response.n8nHealth;
      
      // Simulate what frontend sees for workflow status
      const workflowStatus = n8nHealth.n8nWorkflowStatus;
      const activeCount = workflowStatus?.activeCount || 0;
      const totalCount = workflowStatus?.totalCount || 0;
      
      console.log('📋 Workflow Status (Frontend View):');
      console.log(`  Display: "${activeCount} active workflow(s) out of ${totalCount} total"`);
      console.log(`  Raw data: activeCount=${activeCount}, totalCount=${totalCount}`);
      console.log(`  Issue: ${activeCount === 0 && totalCount === 0 ? 'Shows 0/0 due to API restriction' : 'OK'}`);
      
      // Simulate what frontend sees for webhook status
      const webhookStatus = n8nHealth.n8nWebhookStatus;
      console.log('\n🔗 Webhook Status (Frontend View):');
      
      if (webhookStatus) {
        const webhookKeys = Object.keys(webhookStatus);
        console.log(`  Webhook objects found: ${webhookKeys.join(', ')}`);
        
        let activeWebhooks = 0;
        webhookKeys.forEach(key => {
          const webhook = webhookStatus[key];
          if (webhook && webhook.reachable) {
            activeWebhooks++;
            console.log(`  ✅ ${key}: ${webhook.message}`);
          } else {
            console.log(`  ❌ ${key}: Not reachable`);
          }
        });
        
        console.log(`  Active webhooks: ${activeWebhooks}`);
        console.log(`  Display: ${activeWebhooks > 0 ? `${activeWebhooks} webhook endpoints active` : 'No webhook endpoints active'}`);
      } else {
        console.log('  ❌ No webhook status object found');
      }
      
      console.log('\n💡 Recommendations:');
      if (activeCount === 0 && totalCount === 0) {
        console.log('  🔧 Workflow count issue: API access to N8N workflows is restricted');
        console.log('     - This is cosmetic - webhooks are working fine');
        console.log('     - Consider showing "N/A" instead of "0/0" for restricted API');
      }
      
      const webhookKeys = Object.keys(webhookStatus || {});
      const activeWebhooks = webhookKeys.filter(key => webhookStatus[key]?.reachable).length;
      if (activeWebhooks === 0) {
        console.log('  🔧 Webhook display issue: Frontend expects different webhook format');
      } else {
        console.log('  ✅ Webhook status should display correctly');
      }
      
    } else {
      console.log('❌ No n8nHealth data in response');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFrontendDisplay();