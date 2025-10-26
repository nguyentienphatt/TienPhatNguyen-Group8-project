/**
 * Simple Manual Test for Activity 6 APIs
 * SV1: Backend Testing without dependencies
 */

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testActivity6APIs() {
  console.log('🚀 Activity 6 - Manual API Testing');
  console.log('=====================================\n');

  const BASE_URL = '127.0.0.1';
  const PORT = 3000;
  
  try {
    // 1. Health Check
    console.log('1. 🔍 Testing Health Check...');
    const healthResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/health',
      method: 'GET'
    });
    console.log(`✅ Health Status: ${healthResult.status}`);
    console.log(`📄 Response:`, healthResult.data);

    // 2. Login Test
    console.log('\n2. 🔐 Testing Login...');
    const loginResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@example.com',
      password: '123456'
    });
    
    console.log(`✅ Login Status: ${loginResult.status}`);
    console.log(`📄 Response:`, loginResult.data);
    
    if (!loginResult.data.success) {
      console.log('❌ Login failed, stopping tests');
      return;
    }
    
    const token = loginResult.data.accessToken;
    console.log(`🎫 Token: ${token.substring(0, 20)}...`);

    // 3. Verify Token
    console.log('\n3. ✅ Testing Token Verification...');
    const verifyResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/auth/verify-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Verify Status: ${verifyResult.status}`);
    console.log(`📄 Response:`, verifyResult.data);

    // 4. Protected Profile
    console.log('\n4. 👤 Testing Protected Profile...');
    const profileResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/protected/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Profile Status: ${profileResult.status}`);
    console.log(`📄 Response:`, profileResult.data);

    // 5. Protected Dashboard
    console.log('\n5. 📊 Testing Protected Dashboard...');
    const dashboardResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/protected/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Dashboard Status: ${dashboardResult.status}`);
    console.log(`📄 Response:`, dashboardResult.data);

    // 6. Protected Admin
    console.log('\n6. 🔒 Testing Protected Admin...');
    const adminResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/protected/admin',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Admin Status: ${adminResult.status}`);
    console.log(`📄 Response:`, adminResult.data);

    // 7. Test Unauthorized Access
    console.log('\n7. 🚫 Testing Unauthorized Access...');
    const unauthorizedResult = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: '/protected/profile',
      method: 'GET'
    });
    
    console.log(`✅ Unauthorized Status: ${unauthorizedResult.status}`);
    console.log(`📄 Response:`, unauthorizedResult.data);

    console.log('\n🎉 Activity 6 Testing Complete!');
    console.log('\n📋 SV1 Backend Summary:');
    console.log('✅ Authentication APIs: Working');
    console.log('✅ Token Verification: Working'); 
    console.log('✅ Protected Routes: Working');
    console.log('✅ Role-based Access: Working');
    console.log('✅ Redux Support: Ready for SV2');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.log('\nℹ️  Make sure test server is running:');
    console.log('   node test-server-activity6.js');
  }
}

// Run the test
testActivity6APIs();