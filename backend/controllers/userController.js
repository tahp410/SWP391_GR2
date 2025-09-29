import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'customer',
      gender = 'other',
      province = 'N/A',
      city = 'N/A',
      dob = '2000-01-01'
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu tên, email hoặc mật khẩu" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    // Chuẩn hóa số điện thoại: nếu không đúng 10 số thì gán mặc định
    const normalizedPhone = /^\d{10}$/.test((phone || '').toString().trim())
      ? (phone || '').toString().trim()
      : '0000000000';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: normalizedPhone,
      role: (role || 'customer').toLowerCase(),
      gender: (gender || 'other').toLowerCase(),
      province,
      city,
      dob: new Date(dob)
    });

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: '30d'
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Email không tồn tại" });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: "30d",
    });

    // Send response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Lấy user đang đăng nhập từ protect middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    user.password = newPassword; // sẽ được hash bởi pre('save')
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Lấy danh sách tất cả người dùng (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    return res.json(users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      province: user.province,
      city: user.city,
      dob: user.dob,
      createdAt: user.createdAt
    })));
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Xóa người dùng (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    return res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Cập nhật người dùng (admin/employee)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, gender, province, city, password } = req.body;

    const payload = {};
    if (name) payload.name = name;
    if (email) payload.email = email.toLowerCase();
    if (phone) payload.phone = phone;
    if (role) payload.role = role.toLowerCase();
    if (gender) payload.gender = gender.toLowerCase();
    if (province) payload.province = province;
    if (city) payload.city = city;
    
    // Nếu có password mới, hash và cập nhật
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(password.trim(), salt);
    }

    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      province: user.province,
      city: user.city,
      message: password ? 'Cập nhật thông tin và mật khẩu thành công' : 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
