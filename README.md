# 🎬 CineTicket - Online Movie Booking System

Hệ thống đặt vé xem phim trực tuyến hiện đại, hỗ trợ chọn ghế tương tác, thanh toán trực tuyến qua PayOS, xác thực qua Email, check-in bằng mã QR và hệ thống phân quyền quản lý toàn diện (Admin, Employee, Customer).

---

## 📌 MỤC LỤC
1. [Tính Năng Chính](#-tính-năng-chính)
2. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
3. [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
4. [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
5. [Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
6. [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
7. [Tài Khoản Mẫu (Demo)](#-tài-khoản-mẫu-demo)

---

## 🚀 TÍNH NĂNG CHÍNH

### 👤 1. Khách Hàng (Customer Portal)
- **Duyệt & Tìm kiếm phim**: Xem danh sách phim đang chiếu, sắp chiếu, tìm kiếm theo tên, thể loại và ngôn ngữ.
- **Xem chi tiết phim & Trailer**: Thông tin chi tiết đạo diễn, diễn viên, thời lượng, xem trailer trực tiếp.
- **Đặt vé & Chọn ghế tương tác**:
  - Chọn chi nhánh rạp, suất chiếu và phòng chiếu.
  - Sơ đồ chọn ghế trực quan theo từng loại ghế (Standard, VIP, Couple).
  - Đặt đồ ăn / Combo kèm theo.
  - Áp dụng Voucher giảm giá.
- **Thanh toán trực tuyến**:
  - Tích hợp cổng thanh toán **PayOS** (Chuyển khoản QR Code / Thẻ / Ngân hàng).
  - Giữ ghế tự động trong thời gian thanh toán (giải phóng ghế nếu hết hạn).
- **Xác thực & Email Notification**:
  - Đăng ký tài khoản với mã OTP xác thực 6 số gửi qua Gmail (SMTP).
  - Đổi mật khẩu, quên mật khẩu an toàn.
  - Nhận email xác nhận vé kèm mã QR vé sau khi thanh toán thành công.
- **Quản lý cá nhân**: Xem lịch sử mua vé, thông tin cá nhân và vé điện tử.

### 🛡️ 2. Quản Trị Viên (Admin Dashboard)
- **Quản lý phim**: Thêm, sửa, xóa, thay đổi trạng thái (Đang chiếu / Sắp chiếu) và cập nhật poster/trailer.
- **Quản lý rạp & chi nhánh**: Quản lý thông tin chi nhánh, phòng chiếu và cơ sở vật chất.
- **Thiết kế sơ đồ ghế (Seat Layout Designer)**: Đặt vị trí, hàng/cột và phân loại ghế trực quan.
- **Quản lý suất chiếu (Showtimes)**: Tạo suất chiếu theo phim, phòng chiếu, khung giờ và cài đặt giá vé theo loại ghế.
- **Quản lý Voucher & Combo**: Thêm mới mã giảm giá, đặt hạn mức, quản lý combo & sản phẩm đi kèm.
- **Quản lý người dùng**: Xem danh sách, phân quyền (Admin, Employee, Customer), kích hoạt/khóa tài khoản.
- **Báo cáo & Thống kê**: Xem lịch sử giao dịch toàn hệ thống, doanh thu và báo cáo tổng quan.

### 👨‍💼 3. Nhân Viên (Employee Portal)
- **Check-in vé**:
  - Quét mã QR trên vé của khách bằng camera hoặc thiết bị quét.
  - Tìm kiếm & check-in thủ công bằng mã vé/số điện thoại.
- **Bán vé tại rạp**: Quy trình đặt vé trực tiếp tại quầy cho khách mua trực tiếp.

---

## 🛠 CÔNG NGHỆ SỬ DỤNG

### Backend
- **Core**: Node.js, Express.js (ES Modules `import/export`)
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JWT (JSON Web Token), Bcrypt
- **Email Service**: Nodemailer (Gmail SMTP)
- **Payment Gateway**: PayOS Node SDK (`@payos/node`)
- **File Upload**: Multer
- **QR Code Generator**: `qrcode`

### Frontend
- **Framework**: React 19, React Router v7
- **Styling**: Tailwind CSS, PostCSS, Vanilla CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **QR Scanner & Render**: `jsqr`, `qrcode.react`

---

## 📂 CẤU TRÚC DỰ ÁN

```
Booking-Ticket-Movie/
├── backend/
│   ├── config/             # Cấu hình kết nối DB (db.js)
│   ├── controllers/        # Xử lý logic business (User, Movie, Booking, Payment,...)
│   ├── middleware/         # Middleware xác thực (auth), upload,...
│   ├── models/             # Schema Mongoose (User, Movie, Theater, Showtime, Seat, Booking, Voucher,...)
│   ├── routes/             # API routes
│   ├── templates/          # HTML templates cho Email
│   ├── uploads/            # Thư mục lưu trữ file ảnh upload
│   ├── utils/              # Utility functions (mailer, payos,...)
│   ├── .env                # Biến môi trường Backend
│   ├── seeder.js           # Script khởi tạo dữ liệu mẫu
│   └── server.js           # Entry point của Backend Express
├── frontend/
│   ├── public/             # Asset tĩnh public
│   ├── src/
│   │   ├── api/            # Cấu hình Axios API Client
│   │   ├── components/     # React Components
│   │   │   ├── Admin/      # Dashboard Admin & các chức năng quản lý
│   │   │   ├── Employee/   # Giao diện Check-in & Đặt vé tại quầy
│   │   │   └── ...         # Components dùng chung (Header, BookingFlow, MovieDetail,...)
│   │   ├── contexts/       # React Context (AuthContext,...)
│   │   ├── pages/          # Các trang chính
│   │   ├── App.js          # Main App & Router setup
│   │   └── index.js        # Entry point React
│   ├── package.json
│   └── tailwind.config.js
├── EMAIL_SETUP.md          # Hướng dẫn chi tiết thiết lập Gmail SMTP
└── README.md               # Tài liệu hướng dẫn dự án
```

---

## 📋 YÊU CẦU HỆ THỐNG
- **Node.js**: phiên bản `>= 18.x`
- **npm**: phiên bản `>= 9.x`
- **MongoDB**: Đã cài đặt MongoDB Community Server chạy tại local (`mongodb://localhost:27017`) hoặc MongoDB Atlas URI.

---

## ⚡ HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1️⃣ Clone dự án
```bash
git clone https://github.com/tahp410/Online-Movie-Booking-System.git
cd Online-Movie-Booking-System
```

### 2️⃣ Cài đặt & Khởi chạy Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện
npm install

# (Tùy chọn) Chạy Seeder để nạp dữ liệu mẫu vào MongoDB
node seeder.js

# Khởi chạy backend server (chạy tại http://localhost:5000)
npm start
```

### 3️⃣ Cài đặt & Khởi chạy Frontend

Mở một cửa sổ Terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện
npm install

# Khởi chạy frontend (chạy tại http://localhost:3000)
npm start
```

---

## ⚙️ CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

Tạo hoặc chỉnh sửa file `backend/.env` với các thông số sau:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/SWP391_Gr2
JWT_SECRET=your_jwt_secret_key_here

# Cấu hình Email SMTP (Gmail)
SMTP_EMAIL=your-actual-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
CLIENT_URL=http://localhost:3000

# Cấu hình Cổng thanh toán PayOS
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

> 💡 **Lưu ý cấu hình Email**: Xem hướng dẫn tạo **App Password** cho Gmail chi tiết tại [EMAIL_SETUP.md](file:///d:/Booking-Ticket-Movie/EMAIL_SETUP.md).

---

## 🔑 TÀI KHOẢN MẪU (DEMO)

Sau khi chạy `node seeder.js`, bạn có thể sử dụng các tài khoản sau để đăng nhập:

| Vai trò (Role) | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cineticket.com` | `123456` | Quản lý hệ thống, Phim, Rạp, Suất chiếu, User, Thống kê |
| **Employee** | `hoang.staff@cineticket.com` | `123456` | Check-in vé QR Code, bán vé tại quầy |
| **Customer** | `lan22011971@gmail.com` | `123456` | Đặt vé, chọn ghế, thanh toán, xem lịch sử mua vé |

---

## 📝 LICENSE & CONTRIBUTIONS
Dự án được phát triển cho mục đích học tập và nghiên cứu. Mọi đóng góp xin vui lòng tạo Issue hoặc Pull Request.
