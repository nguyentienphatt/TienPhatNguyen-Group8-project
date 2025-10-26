// test-api.js - Simple test script for forgot password API
const https = require('http');

const testForgotPassword = async () => {
  const postData = JSON.stringify({
    email: 'admin@example.com'
  });

  const options = {
    hostname: '127.0.0.1',
    port: 3002,
    path: '/auth/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📧 FORGOT PASSWORD TEST RESULT:');
          console.log('=====================================');
          console.log('✅ Success:', result.success);
          console.log('📝 Message:', result.message);
          
          if (result.data) {
            console.log('\n📋 Data received:');
            console.log('- Email:', result.data.email);
            console.log('- Reset Token:', result.data.resetToken);
            console.log('- Expires:', result.data.resetTokenExpires);
            
            if (result.data.mockEmailInfo) {
              console.log('\n📧 Mock Email Info:');
              console.log('- Reset URL:', result.data.mockEmailInfo.resetUrl);
              console.log('- Sent At:', result.data.mockEmailInfo.sentAt);
              console.log('- Expires At:', result.data.mockEmailInfo.expiresAt);
            }
            
            console.log('\n🔑 COPY THIS TOKEN FOR RESET:');
            console.log('================================');
            console.log(result.data.resetToken);
            console.log('================================');
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

const testViewSentEmails = async () => {
  const options = {
    hostname: '127.0.0.1',
    port: 3002,
    path: '/test/sent-emails',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📬 SENT EMAILS:');
          console.log('================');
          console.log('Total Sent:', result.data.totalSent);
          
          if (result.data.emails && result.data.emails.length > 0) {
            result.data.emails.forEach((email, index) => {
              console.log(`\nEmail ${index + 1}:`);
              console.log('- To:', email.to);
              console.log('- Token:', email.resetToken);
              console.log('- URL:', email.resetUrl);
              console.log('- Sent:', email.sentAt);
              console.log('- Expires:', email.expiresAt);
            });
          }
          
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    console.log('🚀 Testing Forgot Password API...\n');
    
    // Test 1: Send forgot password request
    await testForgotPassword();
    
    // Wait a bit
    setTimeout(async () => {
      // Test 2: View sent emails
      await testViewSentEmails();
      
      console.log('\n✅ Tests completed! Copy the token above to test reset password.');
      console.log('\n📝 Next step: Test reset password with:');
      console.log('POST http://127.0.0.1:3002/auth/reset-password/{YOUR_TOKEN}');
      console.log('Body: {"newPassword": "NewPassword123"}');
      
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

runTests();