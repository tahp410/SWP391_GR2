import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./Register.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  district: "",
  city: "",
  gender: "",
  dateOfBirth: "",
  agreeTerms: false,
};

function passwordStrengthInfo(pw) {
  // Đánh giá độ mạnh: 0..4
  const lengthOK = pw.length >= 8;                       // >= 8 ký tự
  const hasUpper = /[A-Z]/.test(pw);                     // Có chữ hoa
  const hasLower = /[a-z]/.test(pw);                     // Có chữ thường
  const hasNumber = /\d/.test(pw);                       // Có số
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);             // Có ký tự đặc biệt
  // Tính điểm
  let score = 0;
  if (lengthOK) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;

  const label =
    score <= 1 ? "Yếu" : score === 2 ? "Trung bình" : score === 3 ? "Khá" : "Mạnh";

  const percent = (score / 4) * 100;
  return { score, label, percent };
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // Nếu không dùng router, xem chú thích cuối file

  const strength = useMemo(
    () => passwordStrengthInfo(form.password),
    [form.password]
  );

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    // Validate email đơn giản
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    if (!form.confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (!form.district) e.district = "Chọn quận/huyện";
    if (!form.city) e.city = "Chọn thành phố";
    if (!form.gender) e.gender = "Chọn giới tính";
    if (!form.dateOfBirth) e.dateOfBirth = "Chọn ngày sinh";
    if (!form.agreeTerms) e.agreeTerms = "Bạn cần đồng ý điều khoản";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // TODO: Gọi API đăng ký thật ở đây
    // fetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) ... })

    alert("Đăng ký thành công (demo).");
    navigate("/login"); // điều hướng sang trang đăng nhập
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const closeRegister = () => {
    // Điều hướng về trang chủ hoặc gọi prop onClose
    navigate("/");
  };

  return (
    <div className="page-root">
      <div className="background-overlay" />
      <div className="register-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon" aria-hidden>🎬</div>
          <h1 className="logo-title">CineTicket</h1>
          <p className="logo-subtitle">Đăng ký để đặt vé xem phim</p>
        </div>

        {/* Card */}
        <div className="register-card" role="dialog" aria-labelledby="regTitle">
          <div className="card-header">
            <h2 id="regTitle">Đăng ký tài khoản</h2>
            <button
              type="button"
              className="close-btn"
              onClick={closeRegister}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          <form className="register-form" id="registerForm" onSubmit={onSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Nhập họ và tên của bạn"
                value={form.fullName}
                onChange={onChange}
                required
              />
              {errors.fullName && <div className="error">{errors.fullName}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="abc@gmail.com"
                value={form.email}
                onChange={onChange}
                required
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Mật khẩu *</label>
              <div className="password-wrapper">
                <input
                  type={showPw.password ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, password: !s.password }))
                  }
                  aria-label={showPw.password ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  👁
                </button>
              </div>

              <div className="password-strength" aria-live="polite">
                <div className="strength-bar">
                  <div
                    className={`strength-fill s-${strength.score}`}
                    style={{ width: `${strength.percent}%` }}
                    id="strengthBar"
                  />
                </div>
                <span className="strength-text" id="strengthText">
                  Độ mạnh mật khẩu: {strength.label}
                </span>
              </div>

              {errors.password && <div className="error">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <div className="password-wrapper">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  aria-label={showPw.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  👁
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="error">{errors.confirmPassword}</div>
              )}
            </div>

            {/* District */}
            <div className="form-group">
              <label htmlFor="district">Quận/Huyện *</label>
              <select
                id="district"
                name="district"
                value={form.district}
                onChange={onChange}
                required
              >
                <option value="">Chọn quận/huyện</option>
                <option value="ba-dinh">Ba Đình</option>
                <option value="hoan-kiem">Hoàn Kiếm</option>
                <option value="hai-ba-trung">Hai Bà Trưng</option>
                <option value="dong-da">Đống Đa</option>
                <option value="tay-ho">Tây Hồ</option>
                <option value="cau-giay">Cầu Giấy</option>
                <option value="thanh-xuan">Thanh Xuân</option>
                <option value="hoang-mai">Hoàng Mai</option>
                <option value="long-bien">Long Biên</option>
              </select>
              {errors.district && <div className="error">{errors.district}</div>}
            </div>

            {/* City */}
            <div className="form-group">
              <label htmlFor="city">Thành phố *</label>
              <select
                id="city"
                name="city"
                value={form.city}
                onChange={onChange}
                required
              >
                <option value="">Chọn thành phố</option>
                <option value="hanoi">Hà Nội</option>
                <option value="ho-chi-minh">TP. Hồ Chí Minh</option>
                <option value="da-nang">Đà Nẵng</option>
                <option value="hai-phong">Hải Phòng</option>
                <option value="can-tho">Cần Thơ</option>
              </select>
              {errors.city && <div className="error">{errors.city}</div>}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label>Giới tính *</label>
              <div className="gender-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={form.gender === "male"}
                    onChange={onChange}
                    required
                  />
                  <span className="radio-custom" />
                  Nam
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={form.gender === "female"}
                    onChange={onChange}
                    required
                  />
                  <span className="radio-custom" />
                  Nữ
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={form.gender === "other"}
                    onChange={onChange}
                    required
                  />
                  <span className="radio-custom" />
                  Khác
                </label>
              </div>
              {errors.gender && <div className="error">{errors.gender}</div>}
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label htmlFor="dateOfBirth">Ngày sinh *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={onChange}
                required
              />
              {errors.dateOfBirth && (
                <div className="error">{errors.dateOfBirth}</div>
              )}
            </div>

            {/* Terms */}
            <div className="form-group checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={onChange}
                  required
                />
                <span className="checkbox-custom"></span>
                Tôi đồng ý với{" "}
                <a href="#!" className="terms-link">Điều khoản sử dụng</a> và{" "}
                <a href="#!" className="terms-link">Chính sách bảo mật</a>
              </label>
              {errors.agreeTerms && (
                <div className="error">{errors.agreeTerms}</div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="register-btn">Đăng ký</button>

            {/* Divider */}
            <div className="divider">
              <span>Hoặc đăng ký với</span>
            </div>

            {/* Social Login (demo) */}
            <div className="social-login">
              <button type="button" className="social-btn google-btn" onClick={() => alert("Google OAuth (demo)")}>
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTcuNjQgOS4yMDQ1NUMxNy42NCA4LjU2NTkxIDE3LjU4MjcgNy45NTIyNyAxNy40NzY0IDcuMzYzNjRIMTlW MTAuODQwOUgxMS44NDA5QzExLjIzODYgMTMuNTY4MiA4LjIwNDU1IDE1LjI3MjcgNC41LTE1LjI3MjdDMi4wMTU5MSAxNS4yNzI3IDAgMTQuNTQwOSAwIDExLjcyNzNDMCAxMC42MTM2IDAuNzk1NDU1IDkuNjgxODIgMS43NSA5LjEzNjM2QzEuNzUgMTIuMjUgMy41MjI3MyAxNC43NSA2LjM2MzY0IDE0Ljc1QzkuMjA0NTUgMTQuNzUgMTEuNDc3MyAxMi44NDA5IDExLjQ3NzMgMTBWMTBaIiBmaWxsPSIjNDI4NUY0Ii8+PC9zdmc+"
                  alt="Google"
                />
                Google
              </button>
              <button type="button" className="social-btn facebook-btn" onClick={() => alert("Facebook OAuth (demo)")}>
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSAwQzEzLjk3MDYgMCAxOCA0LjAyOTQ0IDE4IDlTMTMuOTcwNiAxOCA5IDE4QzQuMDI5NDQgMTggMCAxMy45NzA2IDAgOVM0LjAyOTQ0IDAgOSAwWiIgZmlsbD0iIzE4NzdGMiIvPjxwYXRoIGQ9Ik0xMi41Mjk0IDkuMTg3NUwxMi45MjA2IDYuNzVIMTAuNVY1LjI1QzEwLjUgNC4xNzMzMyAxMS4wMjY3IDMuMzc1IDEyLjI2NjcgMy4zNzVI MTNWMS4yOTE2N0MxMi4zMjY3IDEuMjAyNSAxMS40MDMzIDEgMTAuNSAxQzggMCA2LjI1IDIuNTI5MTcgNi4yNSA1LjI1VjYuNzVINC4yNVY5LjE4NzV INi4yNVYxN0gxMC41VjkuMTg3NUgxMi41Mjk0WiIgZmlsbD0id2hpdGUiLz48L3N2Zz4="
                  alt="Facebook"
                />
                Facebook
              </button>
            </div>

            {/* Login Link */}
            <div className="login-link">
              Đã có tài khoản?{" "}
              <button type="button" className="linklike" onClick={goToLogin}>
                Đăng nhập ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
