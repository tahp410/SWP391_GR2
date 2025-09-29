import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Xác thực JWT và gắn user vào req
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Người dùng không tồn tại" });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  }

  return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });
};

// Middleware phân quyền: chỉ cho phép admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Không có quyền truy cập. Chức năng này chỉ dành cho quản trị viên" });
};

// Middleware phân quyền: cho phép admin và employee
export const adminOrEmployee = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
    return next();
  }
  return res.status(403).json({ message: "Không có quyền truy cập. Chức năng này dành cho quản trị viên hoặc nhân viên" });
};

// Middleware phân quyền: kiểm tra role cụ thể
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Không có quyền truy cập. Roles được phép: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

export default protect;
