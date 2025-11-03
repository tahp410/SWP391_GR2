import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function AdminPurchaseHistory() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchPurchaseHistory();
  }, [filters, pagination.page]);

  const fetchPurchaseHistory = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);

      const { data } = await axios.get(`${API_BASE}/bookings/history/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(data.bookings || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

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
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-yellow-100 text-yellow-800';
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleConfirmPayment = async (bookingId, action) => {
    if (!window.confirm(`Are you sure you want to ${action === 'approve' ? 'approve' : 'reject'} this payment?`)) {
      return;
    }

    setProcessingId(bookingId);
    try {
      const { data } = await axios.post(
        `${API_BASE}/bookings/payment/confirm`,
        { bookingId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Refresh the list
        await fetchPurchaseHistory();
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert(err?.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout title="Purchase History">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase history...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No purchase history found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Movie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Showtime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => {
                      const movie = booking.showtime?.movie;
                      const showtime = booking.showtime;
                      const user = booking.user;
                      return (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking._id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{user?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{user?.email || ''}</div>
                              {user?.phone && (
                                <div className="text-xs text-gray-500">{user.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {movie?.poster && (
                                <img
                                  src={movie.poster}
                                  alt={movie.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{movie?.title || 'N/A'}</div>
                                {movie?.duration && (
                                  <div className="text-sm text-gray-500">{movie.duration} min</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {showtime ? (
                                <>
                                  <div>{formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}</div>
                                  <div className="text-xs text-gray-500">{formatDate(showtime.startTime)}</div>
                                  {showtime.theater?.name && (
                                    <div className="text-xs text-gray-500">{showtime.theater.name}</div>
                                  )}
                                  {showtime.branch?.name && (
                                    <div className="text-xs text-gray-500">{showtime.branch.name}</div>
                                  )}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.seats?.map(s => `${s.row}${s.number}`).join(', ') || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.totalAmount.toLocaleString()}đ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.paymentMethod ? (
                              <span className="capitalize">{booking.paymentMethod.replace('_', ' ')}</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadge(booking.paymentStatus)}`}>
                              {booking.paymentStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusBadge(booking.bookingStatus)}`}>
                              {booking.bookingStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/purchase/${booking._id}`, { state: { fromHistory: true } })}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              {booking.paymentStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmPayment(booking._id, 'approve')}
                                    disabled={processingId === booking._id}
                                    className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                                    title="Approve Payment"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleConfirmPayment(booking._id, 'reject')}
                                    disabled={processingId === booking._id}
                                    className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                                    title="Reject Payment"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
