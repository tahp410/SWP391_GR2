// Import thư viện mongoose để định nghĩa schema
import mongoose from "mongoose";
// Import bcrypt để mã hóa mật khẩu
import bcrypt from "bcryptjs";

// Định nghĩa schema cho collection User
const userSchema = new mongoose.Schema(
  {
    // Tên người dùng
    name: {
      type: String,
      required: true,  // Bắt buộc phải có
    },
    // Email đăng nhập
    email: {
      type: String,
      required: true,  // Bắt buộc phải có
      unique: true,    // Email phải là duy nhất
      lowercase: true, // Tự động chuyển thành chữ thường
    },
    // Mật khẩu (sẽ được hash)
    password: {
      type: String,
      required: true,  // Bắt buộc phải có
    },
    // Số điện thoại
    phone: {
      type: String,
      required: true,  // Bắt buộc phải có
    },
    // Tỉnh/thành phố
    province: {
      type: String,
      required: true,  // Bắt buộc phải có
    },
    // Quận/huyện
    city: {
      type: String,
      required: true,  // Bắt buộc phải có
    },
    // Giới tính
    gender: {
      type: String,
      enum: ["male", "female", "other"],  // Chỉ cho phép 3 giá trị này
      required: true,  // Bắt buộc phải có
    },
    // Ngày sinh
    dob: {
      type: Date,
      required: true,  // Bắt buộc phải có
    },
    // Vai trò người dùng
    role: {
      type: String,
      enum: ["guest", "customer", "employee", "admin"], // Các role được phép
      default: "customer",  // Mặc định là customer
    },
    // Tùy chọn của người dùng
    preferences: {
      genres: [String],  // Danh sách thể loại phim yêu thích
      favoriteMovies: [  // Danh sách ID các phim yêu thích
        {
          type: mongoose.Schema.Types.ObjectId,  // Kiểu ObjectId
          ref: "Movie",  // Tham chiếu đến collection Movie
        },
      ],
    },

       // Mã xác minh email (6 chữ số)
    verificationCode: {
      type: String,
    },

    // Trạng thái xác minh email
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Trạng thái khóa tài khoản: true = bị khóa (không thể đăng nhập)
    isLocked: {
      type: Boolean,
      default: false,
    },

    // Token để reset mật khẩu (dùng cho chức năng quên mật khẩu)
    resetPasswordToken: {
      type: String,
    },
    // Thời gian hết hạn của token reset mật khẩu
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    // Tự động thêm hai trường:
    // createdAt: thời điểm tạo document
    // updatedAt: thời điểm cập nhật document gần nhất
    timestamps: true,
  }
);

/**
 * Method kiểm tra mật khẩu
 * @param {string} enteredPassword - Mật khẩu người dùng nhập vào
 * @returns {Promise<boolean>} - True nếu mật khẩu đúng, False nếu sai
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  // So sánh mật khẩu nhập vào với mật khẩu đã hash trong database
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Middleware tự động hash mật khẩu trước khi lưu vào database
 * Chạy trước khi gọi hàm save() trên model User
 */
userSchema.pre("save", async function (next) {
  // Kiểm tra xem mật khẩu có bị thay đổi không
  // Nếu không thay đổi hoặc undefined thì bỏ qua
  if (!this.isModified("password") || this.password === undefined) {
    return next();
  }

  try {
    // Tạo salt với độ phức tạp là 10
    const salt = await bcrypt.genSalt(10);
    // Hash mật khẩu với salt vừa tạo
    this.password = await bcrypt.hash(this.password, salt);
    // Chuyển sang middleware tiếp theo
    next();
  } catch (error) {
    // Nếu có lỗi thì chuyển lỗi sang middleware xử lý lỗi
    next(error);
  }
});

// Tạo model User từ schema đã định nghĩa
const User = mongoose.model("User", userSchema);

export default User;