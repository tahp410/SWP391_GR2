import User from '../models/userModel.js';
import transporter from '../config/email.js';
import { generateVerificationEmailHTML } from '../templates/emailTemplate.js';

// Temporary storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Gửi email xác minh
const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`📧 Attempting to send verification email to: ${email}`);
    console.log(`SMTP_EMAIL: ${process.env.SMTP_EMAIL}`);
    console.log(`SMTP_PASSWORD loaded: ${process.env.SMTP_PASSWORD ? 'Yes' : 'No'}`);

    const mailOptions = {
      from: `"🎬 CineTicket" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "🎬 CineTicket - Mã xác minh đăng ký tài khoản",
      html: generateVerificationEmailHTML(code),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
};

// @route   POST /api/auth/send-verification
// @access  Public
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Chuyển email về dạng chữ thường để đảm bảo nhất quán
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "Email đã được đăng ký rồi" });
    }

    // Generate 6-digit verification code (string để tránh lỗi so sánh)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with expiration (5 minutes)
    verificationCodes.set(normalizedEmail, {
      code,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    // Send email
    const emailSent = await sendVerificationEmail(normalizedEmail, code);

    if (emailSent) {
      res.status(200).json({ message: "✅ Mã xác minh đã được gửi đến email của bạn" });
    } else {
      res.status(500).json({ message: "⚠️ Không gửi được email, vui lòng thử lại sau" });
    }
  } catch (error) {
    console.error("Send Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/verify-code
// @access  Public
export const verifyCode = async (req, res) => {
  let { email, code } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const stored = verificationCodes.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ message: "Không tìm thấy mã xác minh cho email này" });
    }

    // Kiểm tra hết hạn
    if (Date.now() > stored.expires) {
      verificationCodes.delete(normalizedEmail);
      return res.status(400).json({ message: "Mã xác minh đã hết hạn" });
    }

    // Giới hạn số lần nhập sai
    if (stored.attempts >= 3) {
      verificationCodes.delete(normalizedEmail);
      return res.status(400).json({ message: "Nhập sai quá 3 lần. Vui lòng yêu cầu mã mới." });
    }

    // So sánh mã xác minh (ép kiểu string để chắc chắn trùng khớp)
    if (stored.code !== String(code).trim()) {
      stored.attempts++;
      console.log(`❌ Wrong code for ${normalizedEmail}. Expected: ${stored.code}, Received: ${code}`);
      return res.status(400).json({ message: "Mã xác minh không đúng" });
    }

    // ✅ Code hợp lệ
    verificationCodes.delete(normalizedEmail);
    console.log(`✅ Email ${normalizedEmail} verified successfully`);
    res.status(200).json({ message: "✅ Xác minh email thành công" });

  } catch (error) {
    console.error("Verify Code Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone, province, city, gender, dob, role, preferences } = req.body;
  console.log("Register User Data:", req.body);

  try {
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "Email đã được đăng ký rồi" });
    }

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      province,
      city,
      gender,
      dob,
      role: role || "customer",
      preferences: preferences || {},
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: "🎉 Đăng ký thành công!",
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
