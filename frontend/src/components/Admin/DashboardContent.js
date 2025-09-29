import React from 'react';
import {
  Building2,
  Users,
  Film,
  Ticket,
  TrendingUp,
  Activity,
  Gift
} from 'lucide-react';

const DashboardContent = () => {
  // Mock data for dashboard summary
  const dashboardStats = {
    totalBranches: 12,
    totalUsers: 2456,
    totalMovies: 89,
    totalBookings: 1240,
    todayBookings: 45,
    monthlyRevenue: 125000
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tổng Chi Nhánh */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Chi Nhánh</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalBranches}</p>
              <p className="text-sm text-green-600 mt-1">↗ +2 chi nhánh mới</p>
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
              <p className="text-sm text-green-600 mt-1">↗ +128 người dùng mới</p>
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
              <p className="text-sm text-green-600 mt-1">↗ +5 phim mới</p>
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
              <p className="text-sm font-medium text-gray-600">Đặt Vé Hôm Nay</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.todayBookings}</p>
              <p className="text-sm text-green-600 mt-1">↗ +12% so với hôm qua</p>
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
              <p className="text-sm text-green-600 mt-1">↗ +25% tháng này</p>
            </div>
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Doanh Thu Tháng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh Thu Tháng</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats.monthlyRevenue.toLocaleString('vi-VN')}₫
              </p>
              <p className="text-sm text-green-600 mt-1">↗ +18% tháng này</p>
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <span className="w-8 h-8 text-emerald-600 text-2xl font-bold">₫</span>
            </div>
          </div>
        </div>

        {/* Voucher */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Voucher</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalVouchers}</p>
              <p className="text-sm text-green-600 mt-1">{dashboardStats.usedVouchers} đã sử dụng</p>
            </div>
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center">
              <Gift className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Hoạt Động Hôm Nay</h3>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+15%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Chi nhánh mới</p>
                  <p className="text-sm text-gray-500">CGV Aeon Mall</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">10:30 AM</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Users size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Người dùng mới</p>
                  <p className="text-sm text-gray-500">john.doe@email.com</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">09:15 AM</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Film size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phim mới được thêm</p>
                  <p className="text-sm text-gray-500">Spider-Man: Across the Spider-Verse</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">08:45 AM</span>
            </div>
          </div>
        </div>

        {/* Popular Branches */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi Nhánh Phổ Biến</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CGV Vincom Center</p>
                  <p className="text-sm text-gray-500">Hà Nội</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">245</p>
                <p className="text-sm text-green-600">đặt vé</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CGV Aeon Mall</p>
                  <p className="text-sm text-gray-500">Hà Nội</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">198</p>
                <p className="text-sm text-green-600">đặt vé</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CGV The Garden</p>
                  <p className="text-sm text-gray-500">TP.HCM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">167</p>
                <p className="text-sm text-green-600">đặt vé</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-yellow-600 font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CGV Crescent Mall</p>
                  <p className="text-sm text-gray-500">TP.HCM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">134</p>
                <p className="text-sm text-green-600">đặt vé</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao Tác Nhanh</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Thêm Chi Nhánh</p>
              <p className="text-sm text-gray-500">Tạo chi nhánh mới</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Film size={24} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Thêm Phim</p>
              <p className="text-sm text-gray-500">Quản lý danh sách phim</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Ticket size={24} className="text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Quản Lý Đặt Vé</p>
              <p className="text-sm text-gray-500">Theo dõi giao dịch</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
