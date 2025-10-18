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
    length: password.length >= 8,
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
  
  // Email verification states
  const [verificationStep, setVerificationStep] = useState('register'); // 'register' | 'verify' | 'completed'
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
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

  // Countdown timer effect
  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Send verification code
  const sendVerificationCode = async (email) => {
    try {
      setIsVerifying(true);
      setErrors({}); // Clear any previous errors
      
      const response = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:5000'}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok) {
        setCountdown(300); // 5 minutes
        setCanResend(false);
        
        if (data.emailSent) {
          alert(`📧 Email xác minh đã được gửi thành công!\n\n📮 Vui lòng kiểm tra hộp thư của: ${email}\n\n⏰ Mã có hiệu lực trong 5 phút\n💡 Lưu ý: Hãy kiểm tra cả thư mục Spam/Junk nếu không thấy email`);
        } else {
          alert(`📧 Mã xác minh: ${data.code}\n\n⚠️ Demo mode: Hệ thống gửi email gặp sự cố.\nTrong thực tế, mã này sẽ được gửi đến email ${email}`);
        }
        return true;
      } else {
        throw new Error(data.message || 'Không thể gửi mã xác minh');
      }
    } catch (error) {
      if (error.message.includes('Email already registered')) {
        setErrors({ email: 'Email này đã được đăng ký' });
        const emailInput = document.getElementById('email');
        if (emailInput) {
          emailInput.focus();
          emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        alert(`Lỗi: ${error.message}`);
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify code
  const verifyEmailCode = async (email, code) => {
    if (!code || code.length !== 6) {
      alert('Vui lòng nhập đủ 6 số của mã xác minh');
      return false;
    }

    try {
      setIsVerifying(true);
      const response = await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Email đã được xác minh thành công!');
        return true;
      } else {
        if (data.message.includes('expired')) {
          alert('❌ Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.');
          setCanResend(true);
          setCountdown(0);
        } else if (data.message.includes('Too many failed attempts')) {
          alert('❌ Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.');
          setCanResend(true);
          setCountdown(0);
        } else {
          alert(`❌ ${data.message}`);
        }
        return false;
      }
    } catch (error) {
      alert(`❌ Lỗi kết nối: ${error.message}`);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Gọn validate
  const validate = () => {
    const e = {};
    let firstErrorField = null;

    if (!form.fullName.trim()) {
      e.fullName = "Vui lòng nhập họ và tên";
      if (!firstErrorField) firstErrorField = "fullName";
    }
    if (!form.email.trim()) {
      e.email = "Vui lòng nhập email";
      if (!firstErrorField) firstErrorField = "email";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = "Email không hợp lệ";
      if (!firstErrorField) firstErrorField = "email";
    }
    if (!form.phone.trim()) {
      e.phone = "Vui lòng nhập số điện thoại";
      if (!firstErrorField) firstErrorField = "phone";
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      e.phone = "Số điện thoại không hợp lệ";
      if (!firstErrorField) firstErrorField = "phone";
    }
    
    // Validation mật khẩu mạnh hơn như changePassword.js
    if (!form.password) {
      e.password = "Vui lòng nhập mật khẩu";
      if (!firstErrorField) firstErrorField = "password";
    } else if (form.password.length < 8) {
      e.password = "Mật khẩu phải có ít nhất 8 ký tự";
      if (!firstErrorField) firstErrorField = "password";
    } else {
      const strength = checkPasswordStrength(form.password);
      if (strength.score < 4) {
        const missing = [];
        if (!strength.checks.length) missing.push("ít nhất 8 ký tự");
        if (!strength.checks.uppercase) missing.push("chữ hoa");
        if (!strength.checks.lowercase) missing.push("chữ thường");
        if (!strength.checks.number) missing.push("số");
        if (!strength.checks.special) missing.push("ký tự đặc biệt");
        e.password = `Mật khẩu cần có: ${missing.join(", ")}`;
        if (!firstErrorField) firstErrorField = "password";
      }
    }
    
    if (!form.confirmPassword) {
      e.confirmPassword = "Vui lòng xác nhận mật khẩu";
      if (!firstErrorField) firstErrorField = "confirmPassword";
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
      if (!firstErrorField) firstErrorField = "confirmPassword";
    }
    if (!form.city) {
      e.city = "Chọn thành phố";
      if (!firstErrorField) firstErrorField = "city";
    }
    if (!form.district) {
      e.district = "Chọn quận/huyện";
      if (!firstErrorField) firstErrorField = "district";
    }
    if (!form.gender) {
      e.gender = "Chọn giới tính";
      if (!firstErrorField) firstErrorField = "gender";
    }
    if (!form.dateOfBirth) {
      e.dateOfBirth = "Chọn ngày sinh";
      if (!firstErrorField) firstErrorField = "dateOfBirth";
    }
    if (!form.agreeTerms) {
      e.agreeTerms = "Bạn cần đồng ý điều khoản";
      if (!firstErrorField) firstErrorField = "agreeTerms";
    }
    
    setErrors(e);
    return { isValid: Object.keys(e).length === 0, firstErrorField, errors: e };
  };

  // Proceed with actual registration after email verification
  const proceedWithRegistration = async () => {
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
        alert("🎉 Đăng ký thành công! Email đã được xác minh.\n\nChào mừng bạn đến với CineTicket!");
        navigate("/");
      } else {
        throw new Error(data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi đăng ký");
    }
  };

  // Gọn onSubmit - Now sends verification code first
  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    
    if (!validation.isValid) {
      // Focus vào trường đầu tiên có lỗi
      if (validation.firstErrorField) {
        const element = document.getElementById(validation.firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // Hiển thị thông báo tổng quan
      const errorCount = Object.keys(validation.errors).length;
      alert(`Vui lòng kiểm tra và điền đầy đủ thông tin! Còn ${errorCount} trường cần hoàn thiện.`);
      return;
    }
    
    // Send verification code and switch to verification step
    const success = await sendVerificationCode(form.email);
    if (success) {
      setVerificationStep('verify');
      setVerificationCode('');
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
            <h2 id="regTitle" className="text-xl font-bold text-yellow-200 m-0">
              {verificationStep === 'verify' ? 'Xác minh email' : 'Đăng ký tài khoản'}
            </h2>
            <button type="button" className="w-9 h-9 border-none rounded-lg bg-white/10 text-white cursor-pointer hover:bg-white/20" onClick={closeRegister} aria-label="Đóng">×</button>
          </div>

          {/* Verification Step */}
          {verificationStep === 'verify' && (
            <div className="text-center space-y-4">
              <div className="text-gray-300 mb-4">
                Chúng tôi đã gửi mã xác minh đến email <strong className="text-yellow-400">{form.email}</strong>
                <br />
                <small className="text-gray-400">Vui lòng kiểm tra cả hộp thư spam</small>
              </div>
              
              <div className="mb-4">
                <label htmlFor="verificationCode" className="block text-yellow-200 text-sm mb-2">Mã xác minh (6 số) *</label>
                <input 
                  type="text" 
                  id="verificationCode" 
                  name="verificationCode" 
                  placeholder="000000" 
                  value={verificationCode} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && verificationCode.length === 6) {
                      document.querySelector('[data-verify-btn]').click();
                    }
                  }}
                  maxLength="6"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-gray-100 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all text-center text-xl tracking-widest"
                  autoComplete="off"
                  autoFocus
                />
                <div className="text-xs text-gray-400 mt-1">
                  Mã có hiệu lực trong {Math.floor(countdown / 60)} phút {countdown % 60} giây
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  data-verify-btn
                  onClick={async () => {
                    if (verificationCode.length === 6) {
                      const success = await verifyEmailCode(form.email, verificationCode);
                      if (success) {
                        setVerificationStep('register');
                        // Proceed with actual registration
                        await proceedWithRegistration();
                      }
                    } else {
                      alert('Vui lòng nhập đủ 6 số');
                      document.getElementById('verificationCode').focus();
                    }
                  }}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {isVerifying ? 'Đang xác minh...' : 'Xác minh'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => sendVerificationCode(form.email)}
                  disabled={!canResend || isVerifying}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {countdown > 0 ? `Gửi lại (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})` : 'Gửi lại mã'}
                </button>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setVerificationStep('register');
                  setVerificationCode('');
                  setCountdown(0);
                  setCanResend(true);
                }}
                className="text-yellow-400 hover:text-yellow-300 underline"
              >
                ← Quay lại chỉnh sửa thông tin đăng ký
              </button>
            </div>
          )}

          {/* Register Form */}
          {verificationStep === 'register' && (
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
                {form.password && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className={`flex items-center ${strengthObj.checks.length ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="mr-1">{strengthObj.checks.length ? '✓' : '✗'}</span>
                      Ít nhất 8 ký tự
                    </div>
                    <div className={`flex items-center ${strengthObj.checks.uppercase ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="mr-1">{strengthObj.checks.uppercase ? '✓' : '✗'}</span>
                      Chứa chữ hoa (A-Z)
                    </div>
                    <div className={`flex items-center ${strengthObj.checks.lowercase ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="mr-1">{strengthObj.checks.lowercase ? '✓' : '✗'}</span>
                      Chứa chữ thường (a-z)
                    </div>
                    <div className={`flex items-center ${strengthObj.checks.number ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="mr-1">{strengthObj.checks.number ? '✓' : '✗'}</span>
                      Chứa số (0-9)
                    </div>
                    <div className={`flex items-center ${strengthObj.checks.special ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="mr-1">{strengthObj.checks.special ? '✓' : '✗'}</span>
                      Chứa ký tự đặc biệt (!@#$%^&*...)
                    </div>
                  </div>
                )}
              </div>
              {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
            </div>
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
                {['male','female','other'].map((g, index) => (
                  <label key={g} className="flex items-center cursor-pointer">
                    <input 
                      type="radio" name="gender" value={g} checked={form.gender === g} onChange={onChange} required 
                      className="sr-only" 
                      id={index === 0 ? "gender" : undefined}
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
            <div className="text-center mt-4 text-gray-400">
              Đã có tài khoản? <button type="button" className="text-yellow-400 hover:text-yellow-300 underline bg-none border-none cursor-pointer p-0 font-inherit" onClick={goToLogin}>Đăng nhập ngay</button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}