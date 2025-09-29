import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
// import transporter from "../config/email.js"; // Đã được di chuyển vào hàm forgotPassword để tạo riêng

/**
 * @desc    Đăng nhập người dùng và trả về JWT
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Email không tồn tại" });
    }

    // Giả định User model có method matchPassword
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Tạo JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc    Đổi mật khẩu người dùng (khi đã đăng nhập)
 * @route   PUT /api/users/password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // req.user được giả định là đã được thiết lập bởi middleware xác thực token
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    // Lưu mật khẩu mới (sẽ được hash trong model pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

/**
 * @desc    Quên mật khẩu (Gửi email chứa link reset token)
 * @route   POST /api/users/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "❌ Không tìm thấy email trong hệ thống" });
    }

    // Tạo token reset
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    // Link reset (frontend của bạn)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Tạo transporter gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Nội dung email
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: user.email,
      subject: "🔑 Reset mật khẩu",
      html: `
        <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
        <p>Click vào link dưới đây để reset:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Link có hiệu lực trong 10 phút.</p>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.json({ message: "📧 Email reset password đã được gửi" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    // Xóa token đã tạo nếu gửi email thất bại
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: "Có lỗi khi gửi email" });
  }
};

/**
 * @desc    Reset mật khẩu bằng token
 * @route   PUT /api/users/resetpassword/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token; // Lấy từ URL, không phải body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // Kiểm tra token còn hạn
    });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Hash mật khẩu mới và lưu vào DB
    // Lưu ý: Nếu bạn đã cấu hình pre-save hook trong Mongoose model để tự động hash,
    // thì không cần đoạn code `bcrypt.genSalt` và `bcrypt.hash` này.
    // Dưới đây là cách an toàn để đảm bảo hash nếu model hook không hoạt động:

    // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(password, salt);

    // Nếu sử dụng pre-save hook, chỉ cần:
    user.password = password;

    // Xóa token reset
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};