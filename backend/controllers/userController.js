// ============================================================================
// USER CONTROLLER - Xử lý các API endpoints liên quan đến User Management
// ============================================================================

// 1. IMPORTS VÀ DEPENDENCIES
import User from "../models/userModel.js"; // Model User để tương tác với MongoDB
import jwt from "jsonwebtoken"; // Thư viện tạo và verify JWT tokens
import bcrypt from "bcryptjs"; // Thư viện hash password để bảo mật

// ============================================================================
// 3. AUTHENTICATION FUNCTIONS - Đăng ký và đăng nhập
// ============================================================================

// REGISTER USER - Đăng ký tài khoản mới (có thể dùng từ admin tạo user)
export const registerUser = async (req, res) => {
  try {
    // DESTRUCTURING với default values để đảm bảo có giá trị mặc định
    const {
      name,
      email,
      password,
      phone,
      role = 'customer',      // Mặc định là customer
      gender = 'other',       // Mặc định là other
      province = 'N/A',       // Mặc định N/A nếu không có
      city = 'N/A',          // Mặc định N/A nếu không có
      dob = '2000-01-01'     // Ngày sinh mặc định
    } = req.body;

    // VALIDATION: Kiểm tra các field bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu tên, email hoặc mật khẩu" });
    }

    // DUPLICATE CHECK: Kiểm tra email đã tồn tại chưa
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" }); // 409 Conflict
    }

    // PHONE NORMALIZATION: Chuẩn hóa số điện thoại
    // Nếu không đúng format 10 số thì gán số mặc định
    const normalizedPhone = /^\d{10}$/.test((phone || '').toString().trim())
      ? (phone || '').toString().trim()
      : '0000000000';

    // CREATE USER: Tạo user mới trong database
    // Password sẽ được auto-hash bởi pre('save') middleware trong User model
    const user = await User.create({
      name,
      email: email.toLowerCase(),         // Chuẩn hóa email
      password,                          // Sẽ được hash tự động
      phone: normalizedPhone,
      role: (role || 'customer').toLowerCase(),
      gender: (gender || 'other').toLowerCase(),
      province,
      city,
      dob: new Date(dob)                // Convert string thành Date object
    });

    // JWT TOKEN GENERATION: Tạo token cho user mới
    const secret = process.env.JWT_SECRET || 'devsecret'; // Lấy secret từ env
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: '30d'                   // Token có hiệu lực 30 ngày
    });

    // SUCCESS RESPONSE: Trả về thông tin user (KHÔNG bao gồm token khi admin tạo user)
    // Token chỉ được trả về khi user tự đăng ký, không phải khi admin tạo user
    return res.status(201).json({       // 201 Created
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Tạo người dùng thành công"
      // Không trả về token để tránh ghi đè token admin
    });
  } catch (error) {
    // ERROR HANDLING: Lỗi có thể do validation, database, hoặc duplicate key
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
    // matchPassword là method được define trong User model
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

// ============================================================================
// 4. USER PROFILE FUNCTIONS - Chức năng liên quan đến profile cá nhân
// ============================================================================

// CHANGE PASSWORD - Đổi mật khẩu (user tự đổi mật khẩu của mình)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // INPUT VALIDATION: Kiểm tra dữ liệu bắt buộc
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // GET CURRENT USER: Lấy user đang đăng nhập từ protect middleware
    // req.user được set bởi authMiddleware sau khi verify JWT token
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

// ============================================================================
// 2. USER MANAGEMENT FUNCTIONS - Các function cho Admin quản lý users
// ============================================================================

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
    if (province) payload.province = province;              // Cập nhật tỉnh/thành
    if (city) payload.city = city;                         // Cập nhật quận/huyện
    
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
