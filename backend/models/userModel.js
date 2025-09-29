import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      enum: ["guest", "customer", "employee", "admin"],
      default: "customer",
    },
    preferences: {
      genres: [String],
      favoriteMovies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Movie",
        },
      ],
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Phương thức để so sánh mật khẩu nhập vào với mật khẩu hash trong DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  // 'this.password' là mật khẩu đã được hash lưu trong DB
  return bcrypt.compare(enteredPassword, this.password);
};

// Middleware 'pre' chạy trước sự kiện 'save' (lưu vào DB)
userSchema.pre("save", async function (next) {
  // Nếu mật khẩu không bị thay đổi, bỏ qua việc hash
  if (!this.isModified("password") || this.password === undefined) {
    return next();
  }

  try {
    // Tạo salt (chuỗi ngẫu nhiên)
    const salt = await bcrypt.genSalt(10);
    // Hash mật khẩu và gán lại vào trường password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;