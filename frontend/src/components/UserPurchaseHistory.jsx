import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Eye } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function UserPurchaseHistory({ employeeView = false }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPurchaseHistory = useCallback(async () => {
    try {
      const endpoint = employeeView
        ? `${API_BASE}/bookings/history/all`
        : `${API_BASE}/bookings/history/user`;

      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings((data?.bookings || []).map((booking) => ({ ...booking })));
    } catch (err) {
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeView, token]);

  useEffect(() => {
    fetchPurchaseHistory();
  }, [fetchPurchaseHistory]);

  // Auto-refresh history list mỗi 5 giây (để catch cập nhật từ employee)
  useEffect(() => {
    if (employeeView && bookings.length > 0) {
      const interval = setInterval(() => {
        fetchPurchaseHistory();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [employeeView, bookings.length, fetchPurchaseHistory]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      confirmed: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
      case 'success':
        return 'Đã thanh toán';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return 'Chưa thanh toán';
    }
  };

  // Kiểm tra vé hết hạn (đã qua giờ chiếu nhưng chưa check-in)
  const isTicketExpired = (booking) => {
    if (booking.checkedIn) return false; // Nếu đã check-in thì không hết hạn
    const showtimeEndTime = new Date(booking.showtime?.endTime);
    return showtimeEndTime < new Date();
  };

  // Lấy trạng thái check-in cho hiển thị
  const getCheckInStatus = (booking) => {
    if (booking.checkedIn) {
      return { label: 'Đã check-in', badge: 'bg-green-100 text-green-800' };
    }
    if (isTicketExpired(booking)) {
      return { label: 'Hết hạn', badge: 'bg-red-100 text-red-800' };
    }
    return { label: 'Chưa check-in', badge: 'bg-yellow-100 text-yellow-800' };
  };

  // Filter bookings dựa trên search, date, và status
  const getFilteredBookings = () => {
    return bookings.filter((booking) => {
      // Search filter (theo customer name, movie, hoặc booking ID)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        booking._id.toLowerCase().includes(searchLower) ||
        booking.showtime?.movie?.title?.toLowerCase().includes(searchLower) ||
        booking.user?.name?.toLowerCase().includes(searchLower) ||
        booking.user?.email?.toLowerCase().includes(searchLower);

      if (searchTerm && !matchesSearch) return false;

      // Date filter
      if (filterDate) {
        const bookingDate = new Date(booking.showtime?.startTime).toISOString().split('T')[0];
        if (bookingDate !== filterDate) return false;
      }

      // Status filter (only for employee view)
      if (employeeView && filterStatus !== 'all') {
        const checkInStatus = getCheckInStatus(booking);
        if (filterStatus === 'checked-in' && !booking.checkedIn) return false;
        if (filterStatus === 'not-checked-in' && booking.checkedIn) return false;
        if (filterStatus === 'expired' && !isTicketExpired(booking)) return false;
      }

      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  const getBookingStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'done':
      case 'completed':
        return 'Hoàn tất';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Đang xử lý';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            {employeeView ? 'Danh sách vé đã đặt' : 'Purchase History'}
          </h1>
        </div>

        {/* Filter Section (Employee View Only) */}
        {employeeView && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  placeholder="Tên khách, phim, hoặc Booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lọc theo ngày
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lọc theo trạng thái
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="checked-in">Đã check-in</option>
                  <option value="not-checked-in">Chưa check-in</option>
                  <option value="expired">Hết hạn</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDate('');
                    setFilterStatus('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{filteredBookings.length}</span> trong <span className="font-semibold text-gray-900">{bookings.length}</span> vé
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No purchase history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Booking ID
                    </th>
                    {employeeView && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Customer
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Movie
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Showtime
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Seats
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Amount
                    </th>
                    {!employeeView && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Payment
                      </th>
                    )}
                    {employeeView && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Check-in
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(employeeView ? filteredBookings : bookings).map((booking) => {
                    const movie = booking.showtime?.movie;
                    const showtime = booking.showtime;
                    const user = booking.user;
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {booking._id.substring(0, 8)}...
                        </td>
                        {employeeView && (
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{user?.name || 'Khách lẻ'}</span>
                              {user?.email && (
                                <span className="text-xs text-gray-500 truncate">{user.email}</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {movie?.poster && (
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-8 h-10 object-cover rounded"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-gray-900 truncate">{movie?.title || 'N/A'}</div>
                              {movie?.duration && (
                                <div className="text-xs text-gray-500">{movie.duration}m</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {showtime ? (
                              <>
                                <div className="font-medium">{formatTime(showtime.startTime)}</div>
                                <div className="text-xs text-gray-500">{formatDate(showtime.startTime)}</div>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {booking.seats?.map(s => `${s.row}${s.number}`).join(', ') || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {(booking.totalAmount / 1000000).toFixed(1)}M
                        </td>
                        {!employeeView && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getPaymentStatusBadge(booking.paymentStatus)}`}>
                              {getPaymentStatusLabel(booking.paymentStatus)}
                            </span>
                          </td>
                        )}
                        {employeeView && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getCheckInStatus(booking).badge}`}>
                              {getCheckInStatus(booking).label}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getBookingStatusBadge(booking.bookingStatus)}`}>
                            {getBookingStatusLabel(booking.bookingStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/purchase/${booking._id}`, { state: { fromHistory: true } })}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
