import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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

// Hàm kiểm tra độ mạnh mật khẩu giống changePassword.js
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
};

const getStrengthColor = (score) => {
  if (score < 2) return 'bg-red-500';
  if (score < 4) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getStrengthText = (score) => {
  if (score < 2) return 'Yếu';
  if (score < 4) return 'Trung bình';
  return 'Mạnh';
};

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/auth/register';

// Data quận/huyện theo thành phố
const districtOptions = {
  "hanoi": [
    "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Tây Hồ", "Cầu Giấy", "Thanh Xuân", "Hoàng Mai", "Long Biên"
  ],
  "ho-chi-minh": [
    "Quận 1", "Quận 3", "Quận 5", "Quận 7", "Quận 10", "Quận 11", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Thủ Đức", "Huyện Bình Chánh"
  ],
  "da-nang": [
    "Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ", "Hòa Vang"
  ],
  "hai-phong": [
    "Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An", "Hải An", "Dương Kinh", "Đồ Sơn"
  ],
  "can-tho": [
    "Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt", "Phong Điền", "Cờ Đỏ"
  ]
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const strengthObj = checkPasswordStrength(form.password);
  const strength = {
    score: strengthObj.score,
    label: getStrengthText(strengthObj.score),
    percent: (strengthObj.score / 5) * 100
  };

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
    setForm((prev) => {
      // Nếu chọn lại thành phố thì reset quận/huyện
      if (name === "city") {
        return { ...prev, city: value, district: "" };
      }
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : name === "dateOfBirth" ? (value ? formatDateToDMY(value) : "") : value,
      };
    });
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
    else if (form.password.length < 6) e.password = "Mật khẩu phải từ 6 ký tự trở lên";
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
        dob: dateForApi
      };

      const response = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const responseText = await response.text();
      let data;
      console.log("Response Text:", responseText); // Debug line
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { throw new Error("Server trả về dữ liệu không hợp lệ"); }
      }
      if (response.ok) {
        alert("Đăng ký thành công!");
        // navigate("/login");
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
    <div className="min-h-screen relative" style={{
      background: `radial-gradient(1100px 600px at 15% 10%, rgba(0,0,0,.45) 0%, transparent 60%), 
                   radial-gradient(900px 500px at 85% 85%, rgba(0,0,0,.35) 0%, transparent 55%), 
                   linear-gradient(145deg, #311017 0%, #7a1f1f 100%)`
    }}>
      <div className="fixed inset-0 pointer-events-none" />
      <div className="min-h-screen grid place-items-center px-4 py-12">
        <div className="text-center mb-5">
          <div className="text-6xl mb-2" aria-hidden>🎬</div>
          <h1 className="text-3xl font-extrabold text-yellow-400 m-0">CineTicket</h1>
          <p className="mt-2 text-gray-300">Đăng ký để đặt vé xem phim</p>
        </div>
        <div className="w-full max-w-lg bg-gradient-to-b from-white/5 to-black/35 border border-yellow-400/20 rounded-2xl shadow-2xl p-6" 
             style={{backgroundColor: '#1b0f0f'}} role="dialog" aria-labelledby="regTitle">
          <div className="flex items-center justify-between mb-4">
            <h2 id="regTitle" className="text-xl font-bold text-yellow-200 m-0">Đăng ký tài khoản</h2>
            <button type="button" className="w-9 h-9 border-none rounded-lg bg-white/10 text-white cursor-pointer hover:bg-white/20" onClick={closeRegister} aria-label="Đóng">×</button>
          </div>
          <form className="grid gap-4" id="registerForm" onSubmit={onSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-yellow-200 text-sm mb-2">Họ và tên *</label>
              <input 
                type="text" id="fullName" name="fullName" placeholder="Nhập họ và tên của bạn" 
                value={form.fullName} onChange={onChange} required 
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
              {errors.fullName && <div className="text-red-400 text-xs mt-1">{errors.fullName}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-yellow-200 text-sm mb-2">Số điện thoại *</label>
              <input 
                type="tel" id="phone" name="phone" placeholder="Nhập số điện thoại" 
                value={form.phone} onChange={onChange} required 
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
              {errors.phone && <div className="text-red-400 text-xs mt-1">{errors.phone}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-yellow-200 text-sm mb-2">Email *</label>
              <input 
                type="email" id="email" name="email" placeholder="abc@gmail.com" 
                value={form.email} onChange={onChange} required 
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
              {errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-yellow-200 text-sm mb-2">Mật khẩu *</label>
              <div className="relative">
                <input 
                  type={showPw.password ? "text" : "password"} id="password" name="password" placeholder="••••••••" 
                  value={form.password} onChange={onChange} required autoComplete="new-password" 
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none text-gray-400 cursor-pointer p-0"
                  onClick={() => setShowPw((s) => ({ ...s, password: !s.password }))}
                  aria-label={showPw.password ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  👁
                </button>
              </div>
              <div className="mt-2">
                <div className="h-1 bg-white/10 rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  Độ mạnh mật khẩu: {strength.label}
                </span>
              </div>
              {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
            </div>
                <button type="button" className="toggle-password" onClick={() => setShowPw((s) => ({ ...s, password: !s.password }))} aria-label={showPw.password ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>👁</button>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-yellow-200 text-sm mb-2">Xác nhận mật khẩu *</label>
              <div className="relative">
                <input 
                  type={showPw.confirm ? "text" : "password"} id="confirmPassword" name="confirmPassword" placeholder="••••••••" 
                  value={form.confirmPassword} onChange={onChange} required autoComplete="new-password" 
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none text-gray-400 cursor-pointer p-0" 
                  onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))} 
                  aria-label={showPw.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  👁
                </button>
              </div>
              {errors.confirmPassword && <div className="text-red-400 text-xs mt-1">{errors.confirmPassword}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="city" className="block text-yellow-200 text-sm mb-2">Thành phố *</label>
              <select 
                id="city" name="city" value={form.city} onChange={onChange} required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              >
                <option value="">Chọn thành phố</option>
                <option value="hanoi">Hà Nội</option>
                <option value="ho-chi-minh">TP. Hồ Chí Minh</option>
                <option value="da-nang">Đà Nẵng</option>
                <option value="hai-phong">Hải Phòng</option>
                <option value="can-tho">Cần Thơ</option>
              </select>
              {errors.city && <div className="text-red-400 text-xs mt-1">{errors.city}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="district" className="block text-yellow-200 text-sm mb-2">Quận/Huyện *</label>
              <select 
                id="district" name="district" value={form.district} onChange={onChange} required disabled={!form.city}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all disabled:opacity-50"
              >
                <option value="">Chọn quận/huyện</option>
                {form.city && districtOptions[form.city]?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.district && <div className="text-red-400 text-xs mt-1">{errors.district}</div>}
            </div>
            <div className="mb-4">
              <label className="block text-yellow-200 text-sm mb-2">Giới tính *</label>
              <div className="flex gap-8">
                {['male','female','other'].map((g) => (
                  <label key={g} className="flex items-center cursor-pointer">
                    <input 
                      type="radio" name="gender" value={g} checked={form.gender === g} onChange={onChange} required 
                      className="sr-only" 
                    />
                    <span className={`w-4 h-4 rounded-full border-2 mr-2 ${form.gender === g ? 'border-yellow-400' : 'border-gray-500'} relative`}>
                      {form.gender === g && <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400" />}
                    </span>
                    <span className="text-gray-100">{g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <div className="text-red-400 text-xs mt-1">{errors.gender}</div>}
            </div>
            <div className="mb-4">
              <label htmlFor="dateOfBirth" className="block text-yellow-200 text-sm mb-2">Ngày sinh *</label>
              <input 
                type="date" id="dateOfBirth" name="dateOfBirth" 
                value={form.dateOfBirth ? parseDMYtoISO(form.dateOfBirth) : ''} 
                onChange={onChange} required placeholder="mm/dd/yyyy" 
                min="01-01-1900" max={new Date().toISOString().split('T')[0]} 
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
              {errors.dateOfBirth && <div className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</div>}
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" id="agreeTerms" name="agreeTerms" checked={form.agreeTerms} onChange={onChange} required 
                  className="w-4 h-4 rounded border-gray-500 bg-gray-800/80 text-yellow-400 focus:ring-yellow-400/30"
                />
                <label htmlFor="agreeTerms" className="text-gray-100 text-sm">
                  Tôi đồng ý với <a href="#!" className="text-yellow-400 hover:underline">Điều khoản sử dụng</a> và <a href="#!" className="text-yellow-400 hover:underline">Chính sách bảo mật</a>
                </label>
              </div>
              {errors.agreeTerms && <div className="text-red-400 text-xs mt-1">{errors.agreeTerms}</div>}
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Đăng ký
            </button>
            <div className="text-center relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative bg-transparent px-4">
                <span className="text-gray-400 text-sm">Hoặc đăng ký với</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => alert("Google OAuth (demo)")} 
                className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-white text-sm font-medium">Google</span>
              </button>
              <button 
                type="button"
                onClick={() => alert("Facebook OAuth (demo)")} 
                className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-white text-sm font-medium">Facebook</span>
              </button>
            </div>
            <div className="text-center mt-4 text-gray-400">
              Đã có tài khoản? <button type="button" className="text-yellow-400 hover:text-yellow-300 underline bg-none border-none cursor-pointer p-0 font-inherit" onClick={goToLogin}>Đăng nhập ngay</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
