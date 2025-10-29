// ============================================================================
// USER CONTROLLER - Xử lý các API endpoints liên quan đến User Management
// ============================================================================

// 1. IMPORTS VÀ DEPENDENCIES
import User from "../models/userModel.js"; // Model User để tương tác với MongoDB
import jwt from "jsonwebtoken"; // Thư viện tạo và verify JWT tokens
import bcrypt from "bcryptjs"; // Thư viện hash password để bảo mật
import crypto from "crypto";
import nodemailer from "nodemailer";
import transporter from "../config/email.js"; // Import transporter từ config/email.js

// REGISTER USER - Đăng ký tài khoản mới (cho người dùng tự đăng ký từ frontend)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu tên, email hoặc mật khẩu" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const normalizedPhone = /^\d{10}$/.test((phone || '').toString().trim())
      ? (phone || '').toString().trim()
      : '0000000000';

    // 🧩 Tạo mã xác minh email 6 chữ số
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Tạo user mới (chưa kích hoạt)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: normalizedPhone,
      role: 'customer',
      gender: 'other',
      province: 'Chưa cập nhật',
      city: 'Chưa cập nhật',
      dob: new Date('2000-01-01'),
      verificationCode,        // Lưu mã xác minh vào DB
      isVerified: false        // Gắn cờ chưa xác minh
    });

    // ✉️ Cấu hình email xác minh
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: user.email,
      subject: "Xác minh tài khoản - CineTicket",
      html: `
        <h2>Chào mừng ${user.name}!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>CineTicket</strong>.</p>
        <p>Mã xác minh của bạn là:</p>
        <h1 style="color:#e74c3c;letter-spacing:3px;">${verificationCode}</h1>
        <p>Vui lòng nhập mã này để hoàn tất quá trình đăng ký.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email xác minh đã được gửi tới ${user.email}`);
    } catch (emailError) {
      console.error("❌ Gửi email thất bại:", emailError);
      return res.status(500).json({
        message: "Đăng ký thành công nhưng không thể gửi email xác minh. Vui lòng thử lại sau."
      });
    }

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '30d' });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản."
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};


// ADD USER - Admin thêm user mới (có thể set role và thông tin đầy đủ)
export const addUser = async (req, res) => {
  try {
    // DESTRUCTURING với default values cho admin tạo user
    const {
      name,
      email,
      password,
      phone,
      role = 'customer',      // Admin có thể chọn role
      gender = 'other',
      province,               // Không set default ở đây
      city,                   // Không set default ở đây  
      dob = '2000-01-01'
    } = req.body;

    // DEBUG LOG
    console.log('ADD USER - Received data:', { name, email, phone, role, gender, province, city, dob });

    // VALIDATION: Kiểm tra các field bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu tên, email hoặc mật khẩu" });
    }

    // ROLE VALIDATION: Kiểm tra role hợp lệ
    const validRoles = ['customer', 'employee', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    // DUPLICATE CHECK: Kiểm tra email đã tồn tại chưa
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    // PHONE NORMALIZATION: Chuẩn hóa số điện thoại
    const normalizedPhone = /^\d{10}$/.test((phone || '').toString().trim())
      ? (phone || '').toString().trim()
      : '0000000000';

    // ADDRESS PROCESSING: Xử lý province và city
    const finalProvince = (province && province.trim() !== '') ? province.trim() : 'Chưa cập nhật';
    const finalCity = (city && city.trim() !== '') ? city.trim() : 'Chưa cập nhật';

    console.log('ADD USER - Final address:', { finalProvince, finalCity });

    // CREATE USER: Tạo user mới với đầy đủ thông tin
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,                          // Sẽ được hash tự động
      phone: normalizedPhone,
      role: role.toLowerCase(),
      gender: (gender || 'other').toLowerCase(),
      province: finalProvince,
      city: finalCity,
      dob: new Date(dob)
    });

    // SUCCESS RESPONSE: Trả về thông tin user (KHÔNG có token)
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      province: user.province,
      city: user.city,
      dob: user.dob,
      message: "Thêm người dùng thành công"
      // Không trả về token vì admin không cần đăng nhập vào tài khoản mới tạo
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// LOGIN USER - Đăng nhập tài khoản
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // INPUT VALIDATION: Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    // USER LOOKUP: Tìm user theo email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Email không tồn tại" }); // 401 Unauthorized
    }

    // PASSWORD VERIFICATION: Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // JWT TOKEN GENERATION: Tạo token cho session
    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: "30d",                 // Token có hiệu lực 30 ngày
    });

    // SUCCESS RESPONSE: Trả về thông tin user và token để frontend lưu
    res.json({
      _id: user._id,                    // User ID để identify
      name: user.name,                  // Tên để hiển thị
      email: user.email,                // Email để hiển thị
      role: user.role,                  // Role để phân quyền frontend
      token: token,                     // JWT token cho các request sau
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// CHANGE PASSWORD - Đổi mật khẩu (user tự đổi mật khẩu của mình)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // INPUT VALIDATION: Kiểm tra dữ liệu bắt buộc
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // GET CURRENT USER: Lấy user đang đăng nhập từ protect middleware
  
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // VERIFY CURRENT PASSWORD: Xác minh mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // PASSWORD SIMILARITY CHECK: Đảm bảo mật khẩu mới khác mật khẩu cũ
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    // UPDATE PASSWORD: Cập nhật mật khẩu mới
    user.password = newPassword; // Sẽ được hash bởi pre('save') middleware trong model
    await user.save();           // Trigger pre('save') hook để hash password

    // SUCCESS RESPONSE
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    // ERROR HANDLING
    return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};


// GET ALL USERS - Lấy danh sách tất cả người dùng (chỉ admin)
export const getAllUsers = async (req, res) => {
  try {
    // TÌM TẤT CẢ USERS: select('-password') để loại bỏ field password khỏi kết quả
    // sort({ createdAt: -1 }) để sắp xếp theo thời gian tạo mới nhất trước
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // DATA TRANSFORMATION: Chuyển đổi dữ liệu thành format cần thiết cho frontend
    return res.json(users.map(user => ({
      _id: user._id,           // MongoDB ObjectId
      name: user.name,         // Tên người dùng
      email: user.email,       // Email đăng nhập
      phone: user.phone,       // Số điện thoại
      role: user.role,         // Vai trò (admin/employee/customer)
      gender: user.gender,     // Giới tính (male/female/other)
      province: user.province, // Tỉnh/thành phố
      city: user.city,         // Quận/huyện
      dob: user.dob,           // Ngày sinh
      createdAt: user.createdAt // Ngày tạo tài khoản
    })));
  } catch (error) {
    // ERROR HANDLING: Xử lý lỗi server và trả về thông báo
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// DELETE USER - Xóa người dùng (chỉ admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // Lấy user ID từ URL parameters
    
    // TÌM VÀ XÓA USER: findByIdAndDelete thực hiện 2 operations trong 1 lệnh
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      // Nếu không tìm thấy user với ID này
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // SUCCESS: Trả về thông báo xóa thành công
    return res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    // ERROR HANDLING: Lỗi có thể do ID không hợp lệ hoặc lỗi database
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// UPDATE USER - Cập nhật thông tin người dùng (admin/employee)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // Lấy user ID từ URL parameters
    // Destructuring các fields có thể cập nhật từ request body
    const { name, email, phone, role, gender, province, city, password } = req.body;

    // DYNAMIC PAYLOAD BUILDING: Chỉ cập nhật các fields được gửi lên
    const payload = {}; // Object chứa dữ liệu cần cập nhật
    if (name) payload.name = name;                          // Cập nhật tên nếu có
    if (email) payload.email = email.toLowerCase();         // Chuẩn hóa email thành lowercase
    if (phone) payload.phone = phone;                       // Cập nhật số điện thoại
    if (role) payload.role = role.toLowerCase();            // Chuẩn hóa role thành lowercase
    if (gender) payload.gender = gender.toLowerCase();      // Chuẩn hóa gender thành lowercase
    
    // SPECIAL HANDLING FOR ADDRESS: Xử lý province và city
    if (province !== undefined) {
      payload.province = (province && province.trim() !== '') ? province.trim() : 'Chưa cập nhật';
    }
    if (city !== undefined) {
      payload.city = (city && city.trim() !== '') ? city.trim() : 'Chưa cập nhật';
    }
    
    // SPECIAL HANDLING FOR PASSWORD: Mật khẩu cần được hash trước khi lưu
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);                // Tạo salt với độ phức tạp 10
      payload.password = await bcrypt.hash(password.trim(), salt); // Hash password với salt
    }

    // DATABASE UPDATE: findByIdAndUpdate với options
    // new: true - trả về document sau khi update
    // runValidators: true - chạy validation rules từ schema
    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // SUCCESS RESPONSE: Trả về thông tin user đã cập nhật
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      province: user.province,
      city: user.city,
      // DYNAMIC MESSAGE: Thông báo khác nhau tùy có cập nhật password hay không
      message: password ? 'Cập nhật thông tin và mật khẩu thành công' : 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    // ERROR HANDLING: Có thể là lỗi validation, duplicate email, hoặc database error
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * @desc    Quên mật khẩu (Gửi email chứa link reset token)
 * @route   POST /api/users/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 🔍 Kiểm tra xem email có tồn tại trong hệ thống không
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }

    // 🪄 Tạo token reset password
    const resetToken = crypto.randomBytes(32).toString("hex");
    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token hết hạn sau 10 phút

    await existingUser.save();

    // 🔗 Tạo đường link reset password (frontend React)
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    // ✉️ Gửi email reset password
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: existingUser.email,
      subject: "Đặt lại mật khẩu - Movie Ticket System",
      html: `
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào ${existingUser.name},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Hãy nhấn vào liên kết bên dưới để đặt lại:</p>
        <a href="${resetURL}" style="color: #ff4444;">${resetURL}</a>
        <p>Liên kết này sẽ hết hạn sau 10 phút.</p>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "✅ Email đặt lại mật khẩu đã được gửi!" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "❌ Lỗi khi gửi email. Vui lòng thử lại sau." });
  }
};


/**
 * @desc    Reset mật khẩu bằng token
 * @route   PUT /api/users/resetpassword/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const token = req.params.token;

    if (!password || !confirmPassword) {
      return res.status(400).json({ 
        message: "Vui lòng nhập đầy đủ mật khẩu và xác nhận mật khẩu" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: "Mật khẩu và xác nhận mật khẩu không khớp" 
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @desc    Lấy thông tin profile của user
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc    Cập nhật thông tin profile của user
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, dob, phone, province, city, gender } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (dob) user.dob = dob;
    if (phone) user.phone = phone;
    if (province) user.province = province;
    if (city) user.city = city;
    if (gender) user.gender = gender;

    await user.save();

    const userResponse = await User.findById(user._id).select('-password');
    res.json(userResponse);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
