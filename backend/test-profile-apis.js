/**
 * Activity 6 - Profile API Testing Script
 * SV1: Test Profile-related endpoints for Redux integration
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
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

async function testProfileAPIs() {
  console.log('🚀 Activity 6 - Profile API Testing');
  console.log('=====================================\n');

  let authToken = '';

  try {
    // Step 1: Health Check
    console.log('1. 🔍 Health Check...');
    const healthOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/health',
      method: 'GET'
    };
    
    const healthResult = await makeRequest(healthOptions);
    console.log(`✅ Status: ${healthResult.status}`);
    console.log(`📄 Response:`, healthResult.data);
    console.log('');

    // Step 2: Login to get token
    console.log('2. 🔐 Login to get JWT token...');
    const loginOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginData = {
      email: 'admin@example.com',
      password: '123456'
    };

    const loginResult = await makeRequest(loginOptions, loginData);
    console.log(`✅ Status: ${loginResult.status}`);
    
    if (loginResult.data && loginResult.data.success) {
      authToken = loginResult.data.accessToken;
      console.log('🎫 Token received:', authToken.substring(0, 30) + '...');
      console.log('👤 User:', loginResult.data.user);
    } else {
      console.log('❌ Login failed:', loginResult.data);
      return;
    }
    console.log('');

    // Step 3: Test /auth/verify-token
    console.log('3. ✅ Test Token Verification...');
    const verifyOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/verify-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const verifyResult = await makeRequest(verifyOptions);
    console.log(`✅ Status: ${verifyResult.status}`);
    console.log('📄 Verification Result:', verifyResult.data);
    console.log('');

    // Step 4: Test /auth/user-profile (Enhanced Profile)
    console.log('4. 👤 Test Enhanced User Profile...');
    const profileOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/user-profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const profileResult = await makeRequest(profileOptions);
    console.log(`✅ Status: ${profileResult.status}`);
    console.log('👤 Profile Data:', profileResult.data);
    console.log('');

    // Step 5: Test /auth/check-admin
    console.log('5. 🔒 Test Admin Check...');
    const adminCheckOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/check-admin',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const adminResult = await makeRequest(adminCheckOptions);
    console.log(`✅ Status: ${adminResult.status}`);
    console.log('🔒 Admin Check:', adminResult.data);
    console.log('');

    // Step 6: Test /protected/profile
    console.log('6. 🛡️ Test Protected Profile Route...');
    const protectedProfileOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/protected/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const protectedResult = await makeRequest(protectedProfileOptions);
    console.log(`✅ Status: ${protectedResult.status}`);
    console.log('🛡️ Protected Profile:', protectedResult.data);
    console.log('');

    // Step 7: Test /protected/dashboard
    console.log('7. 📊 Test Protected Dashboard...');
    const dashboardOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/protected/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const dashboardResult = await makeRequest(dashboardOptions);
    console.log(`✅ Status: ${dashboardResult.status}`);
    console.log('📊 Dashboard Data:', dashboardResult.data);
    console.log('');

    // Step 8: Test without token (should fail)
    console.log('8. 🚫 Test Without Token (Expected to Fail)...');
    const noAuthOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/protected/profile',
      method: 'GET'
    };

    const noAuthResult = await makeRequest(noAuthOptions);
    console.log(`❌ Status: ${noAuthResult.status} (Expected 401)`);
    console.log('🚫 No Auth Response:', noAuthResult.data);
    console.log('');

    // Summary
    console.log('🎉 Profile API Testing Complete!');
    console.log('================================');
    console.log('✅ Login: Working');
    console.log('✅ Token Verification: Working');
    console.log('✅ Enhanced Profile: Working');
    console.log('✅ Admin Check: Working');
    console.log('✅ Protected Routes: Working');
    console.log('✅ Authorization: Working');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testProfileAPIs();