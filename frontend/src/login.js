// ============================================================================
// LOGIN COMPONENT - Trang đăng nhập cho hệ thống đặt vé xem phim CineTicket
// ============================================================================

// 1. IMPORTS VÀ DEPENDENCIES
import React, { useState, useEffect } from 'react'; // React hooks cho state management và side effects
import { Eye, EyeOff, Mail, Lock, Film, Loader2, AlertCircle, CheckCircle } from 'lucide-react'; // Icons đẹp cho UI
import { useNavigate } from 'react-router-dom'; // Hook điều hướng giữa các trang
import { useAuth } from './contexts/AuthContext'; // Custom hook quản lý authentication

const Login = () => {
  // 2. HOOKS VÀ STATE INITIALIZATION
  const navigate = useNavigate(); // Hook để điều hướng sau khi đăng nhập thành công
  const { login } = useAuth(); // Lấy function login từ AuthContext để lưu token và user data
  
  // 3. STATE MANAGEMENT - Quản lý các trạng thái của component
  const [formData, setFormData] = useState({
    email: '',     // Lưu email người dùng nhập
    password: ''   // Lưu mật khẩu người dùng nhập
  });
  
  const [showPassword, setShowPassword] = useState(false); // Toggle hiện/ẩn mật khẩu
  const [errors, setErrors] = useState({}); // Lưu các lỗi validation
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading khi đăng nhập
  const [rememberMe, setRememberMe] = useState(false); // Trạng thái checkbox ghi nhớ

  // 4. CHỨC NĂNG GHI NHỚ ĐĂNG NHẬP
  // useEffect chạy khi component mount để kiểm tra thông tin đã lưu
  useEffect(() => {
    const savedUser = localStorage.getItem('rememberUser'); // Lấy thông tin đã lưu từ localStorage
    if (savedUser) {
      const userData = JSON.parse(savedUser); // Parse JSON string thành object
      if (userData.rememberMe) { // Nếu user đã chọn ghi nhớ
        setFormData(prev => ({
          ...prev,
          email: userData.email // Tự động điền email đã lưu
        }));
        setRememberMe(true); // Tự động check checkbox ghi nhớ
      }
    }
  }, []); // Dependencies rỗng nghĩa là chỉ chạy 1 lần khi component mount

  // 5. XỬ LÝ THAY ĐỔI INPUT VÀ AUTO CLEAR ERRORS
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Destructuring để lấy name và value từ input
    setFormData(prev => ({
      ...prev,
      [name]: value // Cập nhật field tương ứng trong formData
    }));
    
    // TÍNH NĂNG THÔNG MINH: Tự động xóa lỗi khi user bắt đầu sửa field đó
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '' // Xóa lỗi của field đang được sửa
      }));
    }
  };

  // 6. TOGGLE HIỆN/ẨN MẬT KHẨU - Cải thiện UX
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Đảo ngược trạng thái hiện/ẩn mật khẩu
  };

  // 7. VALIDATION FORM - Kiểm tra dữ liệu trước khi gửi
  const validateForm = () => {
    const newErrors = {}; // Object chứa các lỗi

    // Validation cho EMAIL
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) { // Regex kiểm tra format email
      newErrors.email = 'Email không hợp lệ';
    }

    // Validation cho PASSWORD
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) { // Yêu cầu tối thiểu 6 ký tự
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    return newErrors; // Trả về object chứa lỗi (rỗng nếu không có lỗi)
  };

  // 8. XỬ LÝ ĐĂNG NHẬP CHÍNH - Function quan trọng nhất
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form submit mặc định của browser
    
    // BƯỚC 1: Validate form trước khi gửi API
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) { // Nếu có lỗi
      setErrors(validationErrors); // Hiển thị lỗi cho user
      return; // Dừng xử lý
    }

    // BƯỚC 2: Bắt đầu quá trình đăng nhập
    setIsLoading(true); // Hiển thị loading spinner
    setErrors({}); // Xóa các lỗi cũ

    try {
      // BƯỚC 3: Gửi request đến backend API
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Báo server nhận JSON
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json(); // Parse response thành JSON

      // BƯỚC 4: Kiểm tra response từ server
      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // BƯỚC 5: Chuẩn bị dữ liệu user để lưu
      const userData = {
        id: data._id,     // ID từ MongoDB
        name: data.name,  // Tên user
        email: data.email, // Email user
        role: data.role   // Vai trò (admin/employee/customer)
      };
      
      // BƯỚC 6: XỬ LÝ CHỨC NĂNG GHI NHỚ ĐĂNG NHẬP
      if (rememberMe) {
        // Nếu user chọn ghi nhớ → Lưu email vào localStorage
        localStorage.setItem('rememberUser', JSON.stringify({
          email: formData.email,
          rememberMe: true
        }));
      } else {
        // Nếu không chọn ghi nhớ → Xóa thông tin đã lưu
        localStorage.removeItem('rememberUser');
      }
      
      // BƯỚC 7: Lưu token và user data vào AuthContext
      login(data.token, userData); // Gọi function login từ AuthContext

      // BƯỚC 8: Reset form sau khi đăng nhập thành công
      setFormData({
        email: '',
        password: ''
      });
      setErrors({});
      
      // BƯỚC 9: Chuyển hướng đến trang chủ
      window.location.href = '/home';
      
    } catch (error) {
      // XỬ LÝ LỖI: Hiển thị lỗi cho user nếu đăng nhập thất bại
      setErrors({
        general: error.message || 'Đã có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      // LUÔN CHẠY: Tắt loading state dù thành công hay thất bại
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 9. RENDER JSX - GIAO DIỆN NGƯỜI DÙNG
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      {/* BACKGROUND EFFECTS - Tạo hiệu ứng nền cinema */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-500/5 to-yellow-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full mb-6 shadow-2xl border-2 border-yellow-400/30">
            <Film className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent mb-2">
            CineTicket
          </h1>
          <p className="text-gray-400 text-lg">Đăng nhập để đặt vé xem phim</p>
        </div>

        {/* Login Form */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-yellow-400/20 p-8">
          <div className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{errors.general}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-yellow-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/80 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                  placeholder="Nhập email của bạn"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-yellow-400">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 bg-gray-800/80 border border-yellow-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                  placeholder="Nhập mật khẩu của bạn"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                  rememberMe 
                    ? 'bg-red-600 border-red-600' 
                    : 'border-yellow-400/30 hover:border-yellow-400/50'
                }`}>
                  {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-gray-400 text-sm">Ghi nhớ đăng nhập</span>
              </label>
              
              <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors">
                Quên mật khẩu?
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800/50 disabled:to-red-800/50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-xl border border-yellow-400/20"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                  onClick={() => navigate('/Register')}>
                        Đăng ký ngay
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Điều khoản sử dụng
            </button>
            {' '}và{' '}
            <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Chính sách bảo mật
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;