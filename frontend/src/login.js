import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Film, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Lưu thông tin user và token
      const userData = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      };
      login(data.token, userData);

      // Reset form
      setFormData({
        email: '',
        password: ''
      });
      setErrors({});

      // Chuyển hướng đến trang chủ
      window.location.href = '/home';

    } catch (error) {
      setErrors({
        general: error.message || 'Đã có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Implement Google OAuth login
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login clicked');
    // Implement Facebook OAuth login
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      {/* Background movie elements */}
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
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${rememberMe
                    ? 'bg-red-600 border-red-600'
                    : 'border-yellow-400/30 hover:border-yellow-400/50'
                  }`}>
                  {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-gray-400 text-sm">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
              >
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black/60 text-gray-400">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-white text-sm font-medium">Google</span>
              </button>

              <button
                onClick={handleFacebookLogin}
                className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-white text-sm font-medium">Facebook</span>
              </button>
            </div>

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