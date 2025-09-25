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

export default protect;


