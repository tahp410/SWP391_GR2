import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  district: "",
  city: "",
  gender: "",
  dateOfBirth: "",
  agreeTerms: false,
};

const passwordStrengthInfo = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Yếu", "Yếu", "Trung bình", "Khá", "Mạnh"][score];
  return { score, label, percent: (score / 4) * 100 };
};

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/register';

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const strength = useMemo(() => passwordStrengthInfo(form.password), [form.password]);

  // Helper date format
  const formatDateToDMY = (date) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };
  const parseDMYtoISO = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  // Gọn hàm onChange
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "dateOfBirth" ? (value ? formatDateToDMY(value) : "") : value,
    }));
  };

  // Gọn validate
  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10}$/.test(form.phone)) e.phone = "Số điện thoại không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    if (!form.confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (!form.district) e.district = "Chọn quận/huyện";
    if (!form.city) e.city = "Chọn thành phố";
    if (!form.gender) e.gender = "Chọn giới tính";
    if (!form.dateOfBirth) e.dateOfBirth = "Chọn ngày sinh";
    if (!form.agreeTerms) e.agreeTerms = "Bạn cần đồng ý điều khoản";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Gọn onSubmit
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const dateForApi = parseDMYtoISO(form.dateOfBirth);
      const requestData = {
        name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        province: form.city,
        city: form.district,
        gender: form.gender,
        dob: dateForApi,
        role: "USER",
      };
      debugger
      const response = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const responseText = await response.text();
      let data;
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { throw new Error("Server trả về dữ liệu không hợp lệ"); }
      }
      if (response.ok) {
        alert("Đăng ký thành công!");
        navigate("/login");
      } else {
        throw new Error(data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi đăng ký");
    }
  };

  const goToLogin = () => navigate("/login");
  const closeRegister = () => navigate("/");

  return (
    <div className="page-root">
      <div className="background-overlay" />
      <div className="register-container">
        <div className="logo-section">
          <div className="logo-icon" aria-hidden>🎬</div>
          <h1 className="logo-title">CineTicket</h1>
          <p className="logo-subtitle">Đăng ký để đặt vé xem phim</p>
        </div>
        <div className="register-card" role="dialog" aria-labelledby="regTitle">
          <div className="card-header">
            <h2 id="regTitle">Đăng ký tài khoản</h2>
            <button type="button" className="close-btn" onClick={closeRegister} aria-label="Đóng">×</button>
          </div>
          <form className="register-form" id="registerForm" onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên *</label>
              <input type="text" id="fullName" name="fullName" placeholder="Nhập họ và tên của bạn" value={form.fullName} onChange={onChange} required />
              {errors.fullName && <div className="error">{errors.fullName}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại *</label>
              <input type="tel" id="phone" name="phone" placeholder="Nhập số điện thoại" value={form.phone} onChange={onChange} required />
              {errors.phone && <div className="error">{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" name="email" placeholder="abc@gmail.com" value={form.email} onChange={onChange} required />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Mật khẩu *</label>
              <div className="password-wrapper">
                <input type={showPw.password ? "text" : "password"} id="password" name="password" placeholder="••••••••" value={form.password} onChange={onChange} required autoComplete="new-password" />
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => ({ ...s, password: !s.password }))} aria-label={showPw.password ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>👁</button>
              </div>
              <div className="password-strength" aria-live="polite">
                <div className="strength-bar">
                  <div className={`strength-fill s-${strength.score}`} style={{ width: `${strength.percent}%` }} id="strengthBar" />
                </div>
                <span className="strength-text" id="strengthText">Độ mạnh mật khẩu: {strength.label}</span>
              </div>
              {errors.password && <div className="error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <div className="password-wrapper">
                <input type={showPw.confirm ? "text" : "password"} id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={onChange} required autoComplete="new-password" />
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))} aria-label={showPw.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>👁</button>
              </div>
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="district">Quận/Huyện *</label>
              <select id="district" name="district" value={form.district} onChange={onChange} required>
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
            <div className="form-group">
              <label htmlFor="city">Thành phố *</label>
              <select id="city" name="city" value={form.city} onChange={onChange} required>
                <option value="">Chọn thành phố</option>
                <option value="hanoi">Hà Nội</option>
                <option value="ho-chi-minh">TP. Hồ Chí Minh</option>
                <option value="da-nang">Đà Nẵng</option>
                <option value="hai-phong">Hải Phòng</option>
                <option value="can-tho">Cần Thơ</option>
              </select>
              {errors.city && <div className="error">{errors.city}</div>}
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-yellow-400 mb-2">Giới tính *</label>
              <div className="flex justify-start items-center gap-8">
                {['male','female','other'].map((g) => (
                  <label key={g} className="flex items-center justify-center cursor-pointer relative h-6">
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={onChange} required className="sr-only peer" />
                    <span className={`inline-block w-4 h-4 rounded-full border-2 absolute top-1/2 -translate-y-1/2 ${form.gender === g ? 'border-yellow-400' : 'border-gray-500'}`}>{form.gender === g && (<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400" />)}</span>
                    <span className="text-white ml-6">{g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="mt-1 text-sm text-red-400">{errors.gender}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Ngày sinh *</label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" value={form.dateOfBirth ? parseDMYtoISO(form.dateOfBirth) : ''} onChange={onChange} required placeholder="dd/mm/yyyy" min="01-01-1900" max={new Date().toISOString().split('T')[0]} className="date-input" />
              {errors.dateOfBirth && <div className="error">{errors.dateOfBirth}</div>}
            </div>
            <div className="form-group checkbox-group">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={form.agreeTerms} onChange={onChange} required className="h-4 w-4 rounded border-gray-500 bg-gray-800/80 text-yellow-400 focus:ring-yellow-400/30" />
                <label htmlFor="agreeTerms" className="text-white text-sm">Tôi đồng ý với <a href="#!" className="text-yellow-400 hover:underline">Điều khoản sử dụng</a> và <a href="#!" className="text-yellow-400 hover:underline">Chính sách bảo mật</a></label>
              </div>
              {errors.agreeTerms && <div className="error">{errors.agreeTerms}</div>}
            </div>
            <button type="submit" className="register-btn">Đăng ký</button>
            <div className="divider"><span>Hoặc đăng ký với</span></div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => alert("Google OAuth (demo)")} className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-white text-sm font-medium">Google</span>
              </button>
              <button onClick={() => alert("Facebook OAuth (demo)")} className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-white text-sm font-medium">Facebook</span>
              </button>
            </div>
            <div className="login-link">Đã có tài khoản? <button type="button" className="linklike" onClick={goToLogin}>Đăng nhập ngay</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
