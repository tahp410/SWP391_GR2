/**
 * Cấu hình và khởi tạo Nodemailer để gửi email thông qua Gmail SMTP
 * 
 * File này tạo và xuất một đối tượng transporter của Nodemailer, cho phép:
 * 1. Kết nối với Gmail SMTP server
 * 2. Xác thực bằng tài khoản Gmail
 * 3. Gửi email từ ứng dụng
 * 
 * Cách sử dụng:
 * 1. Import transporter vào file cần gửi email
 * 2. Dùng transporter.sendMail() để gửi email
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("📧 SMTP_EMAIL:", process.env.SMTP_EMAIL);
console.log("📧 SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "(loaded)" : "(missing)");

// Tạo đối tượng transporter với cấu hình Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",          // Sử dụng dịch vụ Gmail
  auth: {
    user: process.env.SMTP_EMAIL,     // Email người gửi
    pass: process.env.SMTP_PASSWORD,  // Mật khẩu ứng dụng Gmail
  },
});

// Xuất transporter để có thể import ở các file khác
export default transporter;