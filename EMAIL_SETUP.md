# 📧 Hướng dẫn cấu hình Email cho CineTicket

## 🚀 Cách thiết lập gửi email thực

### Bước 1: Tạo App Password cho Gmail

1. **Đăng nhập Gmail** của bạn
2. **Vào Google Account Settings**: https://myaccount.google.com/
3. **Chọn Security** → **2-Step Verification** (phải bật trước)
4. **Tìm "App passwords"** → **Generate app password**
5. **Chọn "Mail"** và **"Other"** → Nhập "CineTicket"
6. **Copy password** được tạo (dạng: xxxx xxxx xxxx xxxx)

### Bước 2: Cập nhật file .env

Mở file `backend/.env` và thay đổi:

```env
# Thay đổi thông tin email thực của bạn
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASS=your-app-password-from-step1
```

### Bước 3: Restart Server

```bash
cd backend
npm start
```

## 🎯 Kết quả

- ✅ **Email thực**: Người dùng sẽ nhận mã xác minh trong email
- ✅ **HTML Template**: Email đẹp với branding CineTicket
- ✅ **Fallback**: Nếu email fail, vẫn hiển thị mã trong console
- ✅ **Security**: Mã có thời hạn 5 phút, giới hạn 3 lần thử

## 🔧 Test

1. Điền form đăng ký với email thật của bạn
2. Ấn "Đăng ký"  
3. Kiểm tra email (và spam folder)
4. Nhập mã 6 số nhận được
5. Hoàn tất đăng ký!

## 📝 Lưu ý

- Gmail App Password chỉ hoạt động khi đã bật 2FA
- Trong môi trường production, nên sử dụng SendGrid, AWS SES, hoặc dịch vụ email chuyên nghiệp
- Không commit file .env với thông tin thật lên Git!