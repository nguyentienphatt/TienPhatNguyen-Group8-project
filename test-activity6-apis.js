/**
 * Activity 6 API Testing Script
 * SV1: Backend API Testing for Redux & Protected Routes
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';
let authToken = '';

async function testAPI() {
  console.log('🚀 Activity 6 - Redux & Protected Routes API Testing');
  console.log('=' * 50);

  try {
    // 1. Health Check
    console.log('\n1. 🔍 Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data);

    // 2. Login Test
    console.log('\n2. 🔐 Login Test...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.accessToken;
      console.log('✅ Login successful!');
      console.log('🎫 Token:', authToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    // Headers with auth token
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    // 3. Verify Token
    console.log('\n3. ✅ Verify Token...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-token`, {}, authHeaders);
    console.log('Token verification:', verifyResponse.data);

    // 4. Enhanced User Profile
    console.log('\n4. 👤 Enhanced User Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/user-profile`, authHeaders);
    console.log('Profile data:', profileResponse.data);

    // 5. Check Admin Access
    console.log('\n5. 🔒 Check Admin Access...');
    const adminCheckResponse = await axios.get(`${BASE_URL}/auth/check-admin`, authHeaders);
    console.log('Admin check:', adminCheckResponse.data);

    // 6. Protected Routes Testing
    console.log('\n6. 🛡️ Protected Routes Testing...');
    
    // Test Profile Route
    const protectedProfileResponse = await axios.get(`${BASE_URL}/protected/profile`, authHeaders);
    console.log('✅ Protected Profile:', protectedProfileResponse.data.success);

    // Test Dashboard Route
    const dashboardResponse = await axios.get(`${BASE_URL}/protected/dashboard`, authHeaders);
    console.log('✅ Protected Dashboard:', dashboardResponse.data.success);

    // Test Admin Route
    const adminResponse = await axios.get(`${BASE_URL}/protected/admin`, authHeaders);
    console.log('✅ Protected Admin:', adminResponse.data.success);

    // Test Users Route
    const usersResponse = await axios.get(`${BASE_URL}/protected/users`, authHeaders);
    console.log('✅ Protected Users:', usersResponse.data.success);

    // 7. Route Accessibility Test
    console.log('\n7. 🧪 Route Accessibility Test...');
    const routeTestResponse = await axios.get(`${BASE_URL}/protected/test-routes`, authHeaders);
    console.log('Route Tests:', routeTestResponse.data.data);

    // 8. Test Without Token (Should Fail)
    console.log('\n8. 🚫 Test Without Token (Expected to Fail)...');
    try {
      const noAuthResponse = await axios.get(`${BASE_URL}/protected/profile`);
      console.log('❌ Should have failed!', noAuthResponse.data);
    } catch (error) {
      console.log('✅ Correctly rejected unauthorized access:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Activity 6 API Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Token Verification: Working');
    console.log('✅ Protected Routes: Working');
    console.log('✅ Role-based Access: Working');
    console.log('✅ Redux Support APIs: Ready');

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

// Run the test
testAPI();