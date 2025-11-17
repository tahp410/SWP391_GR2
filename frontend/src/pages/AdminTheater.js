import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Film, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import axiosClient from '../api/axiosClient';

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

  useEffect(() => {
    const storedRemember = localStorage.getItem('rememberMe');
    if (storedRemember === 'true') {
      setRememberMe(true);
    }
  }, []);

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
      const response = await axiosClient.post('/users/login', {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      // Lưu thông tin user và token
      const userData = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      };
      login(data.token, userData, rememberMe);

      // Thêm dòng này để lưu token vào localStorage
      localStorage.setItem('token', data.token);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Reset form
      setFormData({
        email: '',
        password: ''
      });
      setErrors({});

      // Chuyển hướng theo role
      if (data.role === 'admin') {
        window.location.href = '/admin';
      } else if (data.role === 'employee') {
        window.location.href = '/employee';
      } else {
        window.location.href = '/home';
      }

    } catch (error) {
      setErrors({
        general: error.message || 'Đã có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setIsLoading(false);
    }
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
            </div>

            {/* Register Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                  onClick={() => navigate('/register')}
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>





export default Login;};  );    </div>                  onClick={() => navigate('/Register')}>
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