import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2,
  Users,
  Film,
  Ticket,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  ShoppingBag,
  Monitor,
  TicketPercent
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Color schemes for top branches ranking
const BRANCH_COLOR_SCHEMES = [
  { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600' },
  { bg: 'from-green-100 to-green-200', text: 'text-green-600' },
  { bg: 'from-purple-100 to-purple-200', text: 'text-purple-600' },
  { bg: 'from-yellow-100 to-yellow-200', text: 'text-yellow-600' }
];

const DashboardContent = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalBranches: 0,
    totalUsers: 0,
    totalMovies: 0,
    totalBookings: 0,
    todayBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [topBranches, setTopBranches] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch tất cả dữ liệu song song
      const [
        branchesRes,
        usersRes,
        moviesRes,
        bookingsRes
      ] = await Promise.all([
        axios.get(`${API_BASE}/branches`, headers),
        axios.get(`${API_BASE}/users`, headers),
        axios.get(`${API_BASE}/movies`, headers),
        axios.get(`${API_BASE}/bookings/history/all`, headers)
      ]);

      const branches = branchesRes.data || [];
      const users = usersRes.data || [];
      const movies = moviesRes.data || [];
      const bookings = bookingsRes.data?.bookings || [];

      // Tính toán thống kê
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      });

      const completedBookings = bookings.filter(b => b.paymentStatus === 'completed');
      const pendingBookings = bookings.filter(b => b.paymentStatus === 'pending');

      // Tính tổng doanh thu từ các booking đã completed
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Top branches theo số lượng booking
      const branchBookingCount = {};
      bookings.forEach(b => {
        const branchId = b.showtime?.branch?._id || b.showtime?.branch;
        const branchName = b.showtime?.branch?.name || 'Unknown';
        if (branchId) {
          if (!branchBookingCount[branchId]) {
            branchBookingCount[branchId] = { name: branchName, count: 0 };
          }
          branchBookingCount[branchId].count++;
        }
      });

      const topBranchesList = Object.entries(branchBookingCount)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent bookings (5 bookings gần nhất)
      const recentBookingsList = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setDashboardStats({
        totalBranches: branches.length,
        totalUsers: users.length,
        totalMovies: movies.length,
        totalBookings: bookings.length,
        todayBookings: todayBookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        totalRevenue
      });

      setTopBranches(topBranchesList);
      setRecentBookings(recentBookingsList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng trở lại!</h1>
            <p className="text-gray-600">Đây là tổng quan về hệ thống quản lý rạp chiếu phim</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
            <p className="text-lg font-semibold text-gray-800">Hôm nay</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tổng Chi Nhánh */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Chi Nhánh</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalBranches}</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Người Dùng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người Dùng</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Phim */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Phim</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalMovies}</p>
            </div>
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Film className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Đặt Vé Hôm Nay */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vé Hôm Nay</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.todayBookings}</p>
            </div>
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <Ticket className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Tổng Đặt Vé */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Đặt Vé</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalBookings}</p>
            </div>
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Vé Đã Thanh Toán */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã Thanh Toán</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.completedBookings}</p>
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Vé Chưa Thanh Toán */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chưa Thanh Toán</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.pendingBookings}</p>
            </div>
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <XCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Tổng Doanh Thu */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardStats.totalRevenue)}
              </p>
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <span className="w-8 h-8 text-emerald-600 text-2xl font-bold">₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Bookings Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Đặt Vé Gần Đây</h3>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Chưa có đặt vé nào</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      booking.paymentStatus === 'completed' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <Ticket size={20} className={
                        booking.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                      } />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.userId?.username || 'Khách hàng'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.movieId?.title || 'Phim'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </p>
                    <p className={`text-xs ${
                      booking.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {booking.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Branches */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi Nhánh Phổ Biến</h3>

          <div className="space-y-4">
            {topBranches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              </div>
            ) : (
              topBranches.map((branch, index) => {
                const scheme = BRANCH_COLOR_SCHEMES[index] || BRANCH_COLOR_SCHEMES[0];
                
                return (
                  <div key={branch._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-br ${scheme.bg} rounded-lg flex items-center justify-center mr-3`}>
                        <span className={`${scheme.text} font-bold`}>{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{branch.name}</p>
                        <p className="text-sm text-gray-500">{branch.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{branch.bookingCount}</p>
                      <p className="text-sm text-green-600">đặt vé</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao Tác Nhanh</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            key="action-branches"
            onClick={() => window.location.href = '/admin/branches'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Chi Nhánh</p>
              <p className="text-sm text-gray-500">Quản lý chi nhánh</p>
            </div>
          </button>

          <button 
            key="action-movies"
            onClick={() => window.location.href = '/admin/movies'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Film size={24} className="text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Phim</p>
              <p className="text-sm text-gray-500">Quản lý phim</p>
            </div>
          </button>

          <button 
            key="action-showtimes"
            onClick={() => window.location.href = '/admin/showtimes'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
              <Calendar size={24} className="text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Lịch Chiếu</p>
              <p className="text-sm text-gray-500">Quản lý suất chiếu</p>
            </div>
          </button>

          <button 
            key="action-users"
            onClick={() => window.location.href = '/admin/users'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Users size={24} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Người Dùng</p>
              <p className="text-sm text-gray-500">Quản lý tài khoản</p>
            </div>
          </button>

          <button 
            key="action-vouchers"
            onClick={() => window.location.href = '/admin/vouchers'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
              <TicketPercent size={24} className="text-pink-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Voucher</p>
              <p className="text-sm text-gray-500">Quản lý khuyến mãi</p>
            </div>
          </button>

          <button 
            key="action-combos"
            onClick={() => window.location.href = '/admin/combos'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <Package size={24} className="text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Combo</p>
              <p className="text-sm text-gray-500">Quản lý combo</p>
            </div>
          </button>

          <button 
            key="action-items"
            onClick={() => window.location.href = '/admin/items'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
              <ShoppingBag size={24} className="text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Sản Phẩm</p>
              <p className="text-sm text-gray-500">Quản lý sản phẩm</p>
            </div>
          </button>

          <button 
            key="action-theaters"
            onClick={() => window.location.href = '/admin/theaters'}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
              <Monitor size={24} className="text-teal-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Phòng Chiếu</p>
              <p className="text-sm text-gray-500">Quản lý rạp</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
