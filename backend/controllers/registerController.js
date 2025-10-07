import User from '../models/userModel.js';
import nodemailer from 'nodemailer';

// Temporary storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`🔧 Attempting to send email to: ${email}`);
    console.log(`🔧 Using EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`🔧 EMAIL_PASS configured: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}`);
    
    const transporter = createTransporter();
    
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    const mailOptions = {
      from: `"🎬 CineTicket" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎬 CineTicket - Mã xác minh đăng ký tài khoản',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CineTicket - Mã xác minh</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #311017 0%, #7a1f1f 100%); padding: 0;">
            
            <!-- Header -->
            <div style="text-align: center; padding: 40px 20px 30px; background: linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.3) 100%);">
              <h1 style="margin: 0; color: #d4af37; font-size: 36px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                🎬 CineTicket
              </h1>
              <p style="margin: 10px 0 0; color: #ffeb9c; font-size: 16px;">
                Đặt vé xem phim dễ dàng, trải nghiệm tuyệt vời
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #d4af37; margin: 0 0 20px; font-size: 24px; text-align: center;">
                Xác minh tài khoản của bạn
              </h2>
              
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Chào bạn! Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #d4af37;">CineTicket</strong>. 
                Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác minh bên dưới:
              </p>

              <!-- Verification Code Box -->
              <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(212,175,55,0.3);">
                <p style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px; font-weight: bold;">
                  MÃ XÁC MINH CỦA BẠN
                </p>
                <div style="background: rgba(26,26,26,0.9); padding: 20px; border-radius: 10px; display: inline-block; min-width: 200px;">
                  <span style="font-size: 36px; font-weight: bold; color: #d4af37; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </span>
                </div>
              </div>

              <!-- Instructions -->
              <div style="background: rgba(255,255,255,0.05); border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #d4af37; margin: 0 0 15px; font-size: 18px;">📋 Hướng dẫn:</h3>
                <ul style="color: #e0e0e0; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Quay lại trang đăng ký CineTicket</li>
                  <li>Nhập mã <strong style="color: #d4af37;">${code}</strong> vào ô xác minh</li>
                  <li>Hoàn tất đăng ký và bắt đầu đặt vé xem phim!</li>
                </ul>
              </div>

              <!-- Important Notes -->
              <div style="background: rgba(255,69,58,0.1); border: 1px solid rgba(255,69,58,0.3); padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #ff453a; margin: 0 0 15px; font-size: 16px;">⚠️ Lưu ý quan trọng:</h3>
                <ul style="color: #ffb3b3; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                  <li><strong>Mã có hiệu lực trong 5 phút</strong> kể từ khi nhận email này</li>
                  <li>Không chia sẻ mã này với bất kỳ ai khác</li>
                  <li>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="http://localhost:3000" style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(212,175,55,0.3);">
                  🎬 Quay lại CineTicket
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: rgba(0,0,0,0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(212,175,55,0.2);">
              <p style="margin: 0 0 10px; color: #999; font-size: 14px;">
                Email này được gửi tự động từ hệ thống CineTicket
              </p>
              <p style="margin: 0; color: #666; font-size: 12px;">
                © 2025 CineTicket. Tất cả quyền được bảo lưu.
              </p>
              <div style="margin-top: 20px;">
                <span style="color: #d4af37; font-size: 24px;">🎬🍿🎭🎪🎨</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};

// @desc    Send email verification code
// @route   POST /api/auth/send-verification
// @access  Public
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (5 minutes)
    verificationCodes.set(email, {
      code: code,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // Try to send email
    const emailSent = await sendVerificationEmail(email, code);
    
    if (emailSent) {
      console.log(`✅ Verification code sent to ${email}: ${code}`);
      res.status(200).json({
        message: 'Mã xác minh đã được gửi đến email của bạn',
        emailSent: true
      });
    } else {
      console.log(`⚠️ Email sending failed, fallback to demo mode for ${email}: ${code}`);
      res.status(200).json({
        message: 'Mã xác minh đã được tạo (Demo mode - kiểm tra console)',
        emailSent: false,
        code: code // Only show in demo mode when email fails
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email verification code
// @route   POST /api/auth/verify-code
// @access  Public
export const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  
  try {
    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code is valid, remove it from storage
    verificationCodes.delete(email);
    
    res.status(200).json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone, province, city, gender, dob, role, preferences } = req.body;
  console.log("Register User Data:", req.body); // Debug line
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      province,
      city,
      gender,
      dob,
      role: role || 'customer',
      preferences: preferences || {},
    });

    // Hide password in response
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};