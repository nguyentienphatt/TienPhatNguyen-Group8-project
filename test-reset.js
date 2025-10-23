// test-reset.js - Test reset password với token
const http = require('http');

const testResetPassword = async (token, newPassword) => {
  const postData = JSON.stringify({
    newPassword: newPassword
  });

  const options = {
    hostname: '127.0.0.1',
    port: 3002,
    path: `/auth/reset-password/${token}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`Status Code: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n🔐 RESET PASSWORD TEST RESULT:');
          console.log('======================================');
          console.log('✅ Success:', result.success);
          console.log('📝 Message:', result.message);
          
          if (result.data) {
            console.log('\n👤 User Info:');
            console.log('- ID:', result.data.user.id);
            console.log('- Name:', result.data.user.name);
            console.log('- Email:', result.data.user.email);
            console.log('- Role:', result.data.user.role);
            console.log('- Reset At:', result.data.resetAt);
          }
          
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// Test reset password
const runResetTest = async () => {
  try {
    const token = 'ed6ed5cef578a844123790f601c23181f4870a8137ba27b268ab0db1c8a56a91';
    const newPassword = 'NewPassword123';
    
    console.log('🚀 Testing Reset Password API...');
    console.log('Token:', token);
    console.log('New Password:', newPassword);
    console.log('');
    
    await testResetPassword(token, newPassword);
    
    console.log('\n✅ Reset password test completed!');
    console.log('\n📝 Next: Test login với password mới:');
    console.log('POST http://127.0.0.1:3002/auth/login');
    console.log('Body: {"email": "admin@example.com", "password": "NewPassword123"}');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

runResetTest();