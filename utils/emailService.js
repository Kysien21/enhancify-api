const nodemailer = require('nodemailer');

// Create email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetLink, userName) => {
  const mailOptions = {
    from: `"Enhancify.AI" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🔐 Password Reset Request - Enhancify.AI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; }
          .header { background-color: #4338CA; color: white; padding: 30px; text-align: center; }
          .content { background-color: white; padding: 40px 30px; }
          .button { 
            display: inline-block; 
            padding: 15px 40px; 
            background-color: #4338CA; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
          }
          .warning { 
            background-color: #FEF3C7; 
            border-left: 4px solid #F59E0B; 
            padding: 15px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password for your Enhancify.AI account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy this link: <br><code>${resetLink}</code></p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link expires in <strong>1 hour</strong></li>
                <li>If you didn't request this, ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            <p>Best regards,<br><strong>The Enhancify.AI Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Enhancify.AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', userEmail);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email config error:', error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  verifyEmailConfig,
};