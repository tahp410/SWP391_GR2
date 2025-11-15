import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function PurchasePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Check if coming from purchase history
  const isFromHistory = location.state?.fromHistory || 
                        new URLSearchParams(location.search).get('fromHistory') === 'true';
  
  // Check if user is employee (from URL path or user data)
  const isEmployee = location.pathname.includes('/employee/') || 
                     new URLSearchParams(location.search).get('from') === 'employee';
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', 'pending', null
  const [notification, setNotification] = useState(null);
  const [ticketQRCode, setTicketQRCode] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const fetchBooking = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(data.booking);
      
      // Do not show legacy stored PNG QR; we only show QR generated from PayOS URL
      setShowQRCode(false);
      
      // Show ticket QR code if payment completed
      if (data.booking.ticketQRCode && data.booking.paymentStatus === 'completed') {
        console.log('Found ticket QR code:', data.booking.ticketQRCode.substring(0, 50) + '...');
        setTicketQRCode(data.booking.ticketQRCode);
      } else if (data.booking.paymentStatus === 'completed' && !data.booking.ticketQRCode) {
        console.log('Payment completed but ticketQRCode not found');
      }
      
      // No bank info in PayOS URL QR flow
      
      // Check payment status
      if (data.booking.paymentStatus === 'completed') {
        setPaymentStatus('success');
      } else if (data.booking.paymentStatus === 'pending') {
        setPaymentStatus('pending');
      } else if (data.booking.paymentStatus === 'failed') {
        setPaymentStatus('failed');
      } else {
        setPaymentStatus(null); // Not paid yet
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setNotification({ type: 'error', message: 'Failed to load booking details' });
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Auto refresh khi payment pending hoặc success nhưng chưa có ticketQRCode
  useEffect(() => {
    if (paymentStatus === 'pending' || (paymentStatus === 'success' && !ticketQRCode)) {
      const interval = setInterval(() => {
        fetchBooking();
      }, 3000); // Refresh mỗi 3 giây

      return () => clearInterval(interval);
    }
  }, [paymentStatus, ticketQRCode, fetchBooking]);

  // Step 1: Generate PayOS payment link (and render as QR)
  const handleGenerateQR = async () => {
    setProcessing(true);
    setNotification(null);
  
    try {
      const origin = window.location.origin;
      const currentPath = `${location.pathname}${location.search}`;
      const movieId = (booking?.showtime?.movie?._id || booking?.showtime?.movie || '').toString();
      const backToSeat = movieId ? `/booking/${encodeURIComponent(movieId)}` : currentPath;
      const successReturnUrl = `${origin}/payment/return?bookingId=${encodeURIComponent(bookingId)}`;
      const cancelReturnUrl = `${origin}/payment/cancel?prev=${encodeURIComponent(currentPath)}&back=${encodeURIComponent(backToSeat)}&bookingId=${encodeURIComponent(bookingId)}`;

      const response = await axios.post(
        `${API_BASE}/bookings/payment/qr`,
        { bookingId, returnUrl: successReturnUrl, cancelUrl: cancelReturnUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data?.success) {
        const payUrl = response.data.paymentUrl || null;
  
        // Hiển thị QR code và link thanh toán ngay trên trang
        setPaymentUrl(payUrl);
        setShowQRCode(Boolean(payUrl));
        
        setNotification({
          type: 'success',
          message: payUrl
            ? 'Mã thanh toán đã được tạo. Quét mã QR hoặc nhấn nút bên dưới để thanh toán.'
            : 'PayOS link generated.'
        });
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create PayOS link';
      setNotification({ type: 'error', message });
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Booking not found</p>
          <button
            onClick={() => navigate(isEmployee ? '/employee' : '/home')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEmployee ? 'Quay về trang nhân viên' : 'Go to Home'}
          </button>
        </div>
      </div>
    );
  }

  const showtime = booking.showtime;
  const movie = showtime?.movie;
  const theater = showtime?.theater;
  const branch = showtime?.branch;

  return (
    <div className="min-w-screen min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEmployee ? 'Thông tin vé đã đặt' : 'Purchase Ticket'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isEmployee) {
                  // Employee: quay về danh sách vé
                  navigate('/employee/bookings');
                } else {
                  // Customer: quay về trang đặt vé
                  const movieId = booking?.showtime?.movie?._id || booking?.showtime?.movie || '';
                  const branchId = booking?.showtime?.branch?._id || booking?.showtime?.branch || '';
                  const start = booking?.showtime?.startTime ? new Date(booking.showtime.startTime) : null;
                  const yyyyMmDd = start ? `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}` : '';
                  if (movieId) {
                    const qp = [];
                    if (branchId) qp.push(`branchId=${branchId}`);
                    if (yyyyMmDd) qp.push(`date=${yyyyMmDd}`);
                    const qs = qp.length ? `?${qp.join('&')}` : '';
                    navigate(`/booking/${movieId}${qs}`);
                  } else {
                    navigate('/movies');
                  }
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              {isEmployee ? 'Quay lại' : 'Back'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Booking Details */}
          <div className="space-y-6">
            {/* Movie Info */}
            {movie && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Movie Information</h2>
                <div className="flex gap-4">
                  {movie.poster && (
                    <img 
                      src={movie.poster} 
                      alt={movie.title} 
                      className="w-24 h-36 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{movie.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">Duration: {movie.duration} minutes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-semibold">{booking._id}</span>
                </div>
                {showtime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Showtime:</span>
                      <span className="font-semibold">
                        {formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">{formatDate(showtime.startTime)}</span>
                    </div>
                    {theater && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Theater:</span>
                        <span className="font-semibold">{theater.name}</span>
                      </div>
                    )}
                    {branch && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch:</span>
                        <span className="font-semibold">{branch.name}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-semibold">
                    {booking.seats?.map(s => `${s.row}${s.number}`).join(', ') || '-'}
                  </span>
                </div>
                {booking.combos?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Combos:</span>
                    <div className="text-right">
                      {booking.combos.map((c, idx) => (
                        <div key={idx} className="font-semibold">
                          {c.combo?.name || 'Combo'} x {c.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {booking.voucher && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voucher:</span>
                    <span className="font-semibold">{booking.voucher.code}</span>
                  </div>
                )}
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{booking.discountAmount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{booking.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-semibold ${
                    booking.paymentStatus === 'completed' ? 'text-green-600' :
                    booking.paymentStatus === 'failed' ? 'text-red-600' :
                    booking.paymentStatus === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {booking.paymentStatus === 'completed' ? 'Successful' :
                     booking.paymentStatus === 'failed' ? 'Failed' :
                     booking.paymentStatus === 'pending' ? 'Pending' :
                     'Not Paid'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Status:</span>
                  <span className={`font-semibold ${
                    booking.bookingStatus === 'done' ? 'text-green-600' :
                    booking.bookingStatus === 'cancelled' ? 'text-red-600' :
                    booking.bookingStatus === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {booking.bookingStatus === 'done' ? 'Done' :
                     booking.bookingStatus === 'cancelled' ? 'Cancelled' :
                     booking.bookingStatus === 'pending' ? 'Pending' :
                     'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: PayOS Actions + QR/Link (Only for customers) */}
          <div className="space-y-6">
            {/* Action to create PayOS payment link - Only show for customers */}
            {!isEmployee && paymentStatus !== 'completed' && paymentStatus !== 'success' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Thanh toán PayOS</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Nhấn "Tạo link PayOS" để tạo mã thanh toán. Thông tin thanh toán sẽ hiển thị ngay trên trang này.
                </p>
                <button
                  onClick={handleGenerateQR}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {processing ? 'Đang tạo...' : 'Tạo link PayOS'}
                </button>
              </div>
            )}

            {/* PayOS QR Display - Hiển thị ngay trên trang (Only for customers) */}
            {!isEmployee && showQRCode && paymentStatus !== 'completed' && paymentStatus !== 'success' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">Thông tin thanh toán</h2>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-lg mb-4">
                    {paymentUrl ? <QRCodeSVG value={paymentUrl} size={280} /> : null}
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      Quét mã QR bằng ứng dụng ngân hàng
                    </p>
                    <p className="text-xs text-gray-500">
                      hoặc nhấn nút bên dưới để mở trang thanh toán
                    </p>
                  </div>

                  {paymentUrl && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                    >
                      Mở trang thanh toán PayOS
                    </a>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg w-full border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Thông tin đơn hàng</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="font-medium text-gray-900">{booking._id.substring(0, 12)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số tiền:</span>
                        <span className="font-bold text-blue-600">{booking.totalAmount.toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ghế:</span>
                        <span className="font-medium text-gray-900">
                          {booking.seats?.map(s => `${s.row}${s.number}`).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Sau khi thanh toán thành công, trang sẽ tự động cập nhật và hiển thị mã QR vé của bạn.
                  </p>
                </div>
              </div>
            )}

            {/* Completed Status with Ticket QR Code */}
            {paymentStatus === 'success' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-600">Payment Completed</h2>
                <div className="flex flex-col items-center justify-center py-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-center text-gray-700 mb-4">
                    Your payment has been confirmed. Your tickets are ready!
                  </p>
                  
                  {/* Ticket QR Code - Hiển thị QR code vé */}
                  {ticketQRCode && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full">
                      <h3 className="text-lg font-semibold mb-2 text-center">Your Ticket QR Code</h3>
                      <p className="text-sm text-gray-600 mb-3 text-center">
                        Show this QR code at the cinema for check-in
                      </p>
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-sm flex justify-center">
                        <img 
                          src={ticketQRCode} 
                          alt="Ticket QR Code" 
                          className="w-64 h-64" 
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Booking ID: {booking._id.substring(0, 8)}
                      </p>
                      {booking.seats && booking.seats.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Seats: {booking.seats.map(s => `${s.row}${s.number}`).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Nếu chưa có QR code, hiển thị thông báo và button refresh */}
                  {!ticketQRCode && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500 mb-3">
                        Ticket QR code is being generated...
                      </p>
                      <button
                        onClick={fetchBooking}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Refreshing...' : 'Refresh QR Code'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                {isEmployee ? (
                  // Employee buttons
                  <>
                    <button
                      onClick={() => navigate('/employee/bookings')}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Quay về danh sách vé
                    </button>
                    <button
                      onClick={() => navigate('/employee')}
                      className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Trang chủ nhân viên
                    </button>
                  </>
                ) : (
                  // Customer buttons
                  <>
                    {paymentStatus === 'success' ? (
                      <button
                        onClick={() => navigate('/purchase-history')}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                      >
                        View Purchase History
                      </button>
                    ) : paymentStatus === 'pending' ? (
                      <button
                        onClick={() => navigate('/purchase-history')}
                        className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700"
                      >
                        View Purchase History
                      </button>
                    ) : paymentStatus === 'failed' ? (
                      <button
                        onClick={() => {
                          const movieId = showtime?.movie?._id || showtime?.movie || '';
                          if (movieId) {
                            navigate(`/booking/${movieId}`);
                          } else {
                            navigate('/movies');
                          }
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Return to Order Seat - Movie / Confirm
                      </button>
                    ) : null}
                    <button
                      onClick={() => navigate('/home')}
                      className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Go to Home
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
