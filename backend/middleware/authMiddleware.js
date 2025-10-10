// Import thư viện JWT để xử lý token
import jwt from "jsonwebtoken";
// Import model User để truy vấn thông tin người dùng
import User from "../models/userModel.js";

// Middleware bảo vệ route, yêu cầu đăng nhập
export const protect = async (req, res, next) => {
  // Khai báo biến lưu token
  let token;

  // Kiểm tra header có chứa token không
  if (
    req.headers.authorization &&                        // Kiểm tra có header authorization
    req.headers.authorization.startsWith("Bearer ")     // Header phải bắt đầu bằng Bearer
  ) {
    try {
      // Tách lấy token từ header (bỏ chữ Bearer)
      token = req.headers.authorization.split(" ")[1];
      // Giải mã token để lấy thông tin user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user trong database và bỏ trường password
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Người dùng không tồn tại" });
      }

      // Gắn thông tin user vào request để sử dụng ở middleware tiếp theo
      req.user = user;
      return next();
    } catch (error) {
      // Nếu token không hợp lệ hoặc hết hạn
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  }

  // Nếu không có token trong header
  return res
    .status(401)
    .json({ message: "Không có token, truy cập bị từ chối" });
};

// Middleware kiểm tra quyền admin
export const adminOnly = (req, res, next) => {
  // Kiểm tra user đã đăng nhập và có role là admin
  if (req.user && req.user.role === "admin") {
    return next();  // Cho phép tiếp tục nếu là admin
  }
  // Trả về lỗi nếu không phải admin
  return res.status(403).json({
    message: "Không có quyền truy cập. Chức năng này chỉ dành cho quản trị viên",
  });
};

// Middleware kiểm tra quyền admin hoặc nhân viên
export const adminOrEmployee = (req, res, next) => {
  // Kiểm tra user đã đăng nhập và có role là admin hoặc employee
  if (req.user && (req.user.role === "admin" || req.user.role === "employee")) {
    return next();  // Cho phép tiếp tục nếu là admin hoặc employee
  }
  // Trả về lỗi nếu không có quyền
  return res.status(403).json({
    message:
      "Không có quyền truy cập. Chức năng này dành cho quản trị viên hoặc nhân viên",
  });
};

// Middleware kiểm tra role động - cho phép nhiều role khác nhau
export const restrictTo = (...roles) => {
  // Trả về một middleware function
  return (req, res, next) => {
    // Kiểm tra user đã đăng nhập chưa
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Kiểm tra role của user có nằm trong danh sách được phép không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Không có quyền truy cập. Roles được phép: ${roles.join(", ")}`,
      });
    }

    // Cho phép tiếp tục nếu role hợp lệ
    next();
  };
};

// Xuất middleware protect làm default export
export default protect;
