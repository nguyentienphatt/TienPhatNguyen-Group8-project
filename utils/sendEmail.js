// utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * Email Service for sending password reset emails
 * Sử dụng Gmail SMTP với App Password
 */

// Tạo transporter với Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_EMAIL, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not regular password)
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates in development
    }
  });
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.userName - User's name
 */
const sendPasswordResetEmail = async ({ to, resetToken, userName }) => {
  try {
    const transporter = createTransporter();

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP server connection verified');

    // Create reset URL - SV2 sẽ tạo frontend page này
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // HTML email template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                margin: -30px -30px 30px -30px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                text-align: left;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
            }
            .button:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            }
            .token-box {
                background-color: #f8f9fa;
                border: 2px dashed #dee2e6;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                text-align: center;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                color: #495057;
                word-break: break-all;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
                <h2>Xin chào ${userName}!</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                
                <p><strong>Bước 1:</strong> Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
                </div>
                
                <p><strong>Bước 2:</strong> Hoặc copy token sau và paste vào form reset password:</p>
                <div class="token-box">
                    ${resetToken}
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Lưu ý quan trọng:</strong><br>
                    • Link này chỉ có hiệu lực trong <strong>15 phút</strong><br>
                    • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này<br>
                    • Để bảo mật, không chia sẻ link này với ai khác
                </div>
                
                <p>Nếu nút không hoạt động, bạn có thể copy và paste URL sau vào trình duyệt:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetUrl}
                </p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động, vui lòng không reply.</p>
                <p>© 2025 Group 8 Project - TienPhatNguyen</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
Xin chào ${userName}!

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Vui lòng truy cập link sau để đặt lại mật khẩu:
${resetUrl}

Hoặc sử dụng token sau: ${resetToken}

Link này chỉ có hiệu lực trong 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Team Group 8 Project
    `;

    // Email options
    const mailOptions = {
      from: {
        name: 'Group 8 Project - TienPhatNguyen',
        address: process.env.GMAIL_EMAIL
      },
      to: to,
      subject: '🔐 Đặt lại mật khẩu - Group 8 Project',
      text: textContent,
      html: htmlTemplate,
      priority: 'high', // Mark as important
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    // Send email
    console.log(`📧 Sending password reset email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Password reset email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    // Throw descriptive error based on error type
    if (error.code === 'EAUTH') {
      throw new Error('Gmail authentication failed. Please check GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env file');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to Gmail SMTP server. Please check your internet connection');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};

/**
 * Send test email to verify SMTP configuration
 * @param {string} to - Test email recipient
 */
const sendTestEmail = async (to) => {
  try {
    const transporter = createTransporter();
    
    const testMailOptions = {
      from: {
        name: 'Group 8 Project - Test',
        address: process.env.GMAIL_EMAIL
      },
      to: to,
      subject: '✅ Test Email - SMTP Configuration Success',
      html: `
        <h2>🎉 SMTP Configuration Test Success!</h2>
        <p>Congratulations! Your Gmail SMTP configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <hr>
        <p><em>This is a test email from Group 8 Project backend.</em></p>
      `,
      text: `
SMTP Configuration Test Success!

Congratulations! Your Gmail SMTP configuration is working correctly.

Sent at: ${new Date().toLocaleString('vi-VN')}

This is a test email from Group 8 Project backend.
      `
    };

    const info = await transporter.sendMail(testMailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTestEmail
};