import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Printer, Loader2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../../style/employee.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function EmployeePurchase() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const printRef = useRef(null);

  const fetchBooking = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(data.booking);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setNotification({ type: 'error', message: 'Không thể tải thông tin đặt vé' });
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Auto check-in when returning from PayOS payment
  useEffect(() => {
    if (!location.state?.fromPayOS || !bookingId || !token) {
      return;
    }
    
    const autoCheckIn = async () => {
      try {
        const response = await axios.post(
          `${API_BASE}/bookings/payment/confirm-cash`,
          { bookingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setNotification({
            type: 'success',
            message: 'Thanh toán thành công! Vé đã được check-in.'
          });
          await fetchBooking();
        }
      } catch (err) {
        // Auto check-in error - don't show notification
      }
    };
    
    autoCheckIn();
  }, [location.state?.fromPayOS, bookingId, token, fetchBooking]);

  useEffect(() => {
    if (!booking) return;
    if (booking.paymentMethod === 'cash') return;
    if (booking.paymentStatus === 'completed') return;

    const interval = setInterval(() => {
      fetchBooking();
    }, 3000);

    return () => clearInterval(interval);
  }, [booking, fetchBooking]);

  const handleGeneratePaymentLink = async () => {
    setProcessing(true);
    setNotification(null);

    try {
      const origin = window.location.origin;
      const currentPath = `${location.pathname}${location.search}`;
      const relatedMovieId = (booking?.showtime?.movie?._id || booking?.showtime?.movie || '').toString();
      const backToSeat = relatedMovieId
        ? `/employee/booking/${encodeURIComponent(relatedMovieId)}`
        : currentPath;
      const successReturnUrl = `${origin}/payment/return?bookingId=${encodeURIComponent(bookingId)}&from=employee`;
      const cancelReturnUrl = `${origin}/payment/cancel?prev=${encodeURIComponent(currentPath)}&back=${encodeURIComponent(backToSeat)}&bookingId=${encodeURIComponent(bookingId)}&from=employee`;

      const response = await axios.post(
        `${API_BASE}/bookings/payment/qr`,
        { bookingId, returnUrl: successReturnUrl, cancelUrl: cancelReturnUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        const payUrl = response.data.paymentUrl || null;
        setPaymentUrl(payUrl);
        setShowQRCode(Boolean(payUrl));

        setNotification({
          type: 'success',
          message: payUrl ? 'Đã tạo link PayOS. Hiển thị QR code cho khách quét hoặc nhấn nút mở trang thanh toán.' : 'Đã tạo yêu cầu thanh toán.'
        });
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tạo link PayOS';
      setNotification({ type: 'error', message });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    setNotification(null);

    try {
      const response = await axios.post(
        `${API_BASE}/bookings/payment/confirm-cash`,
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({ 
          type: 'success', 
          message: 'Xác nhận thanh toán thành công!' 
        });
        await fetchBooking();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Xác nhận thanh toán thất bại';
      setNotification({ type: 'error', message });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé? Hành động này sẽ giải phóng ghế đã đặt.')) {
      return;
    }

    setProcessing(true);
    setNotification(null);

    try {
      const response = await axios.post(
        `${API_BASE}/bookings/payment/cancel`,
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({ 
          type: 'success', 
          message: 'Đã hủy vé thành công' 
        });
        setTimeout(() => {
          const movieId = booking?.showtime?.movie?._id || booking?.showtime?.movie;
          if (movieId) {
            navigate(`/employee/booking/${movieId}`);
          } else {
            navigate('/employee/booking');
          }
        }, 1000);
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Hủy vé thất bại';
      setNotification({ type: 'error', message });
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintTicket = () => {
    setPrintSuccess(true);
  };

  const handleBackToBooking = () => {
    const movieId = booking?.showtime?.movie?._id || booking?.showtime?.movie;
    if (movieId) {
      navigate(`/employee/booking/${movieId}`);
    } else {
      navigate('/employee/booking');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/employee');
    }
  };

  const BackButton = () => (
    <button
      type="button"
      onClick={handleGoBack}
      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
    >
      <ArrowLeft className="h-5 w-5" />
      Quay về
    </button>
  );

  // Kiểm tra vé hết hạn (đã qua giờ chiếu nhưng chưa check-in)
  const isTicketExpired = (booking) => {
    if (booking.checkedIn) return false; // Nếu đã check-in thì không hết hạn
    const showtimeEndTime = new Date(booking.showtime?.endTime);
    return showtimeEndTime < new Date();
  };

  // Lấy trạng thái check-in cho hiển thị
  const getCheckInStatus = (booking) => {
    if (booking.checkedIn) {
      return { label: 'Đã check-in', color: 'text-green-600' };
    }
    if (isTicketExpired(booking)) {
      return { label: 'Hết hạn', color: 'text-red-600' };
    }
    return { label: 'Chưa check-in', color: 'text-yellow-600' };
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
      <div className="emp-page">
        <div className="emp-header">
          <div className="flex items-center justify-between">
          <h1>Đặt vé cho khách</h1>
            <BackButton />
          </div>
          <ol className="emp-steps">
            <li>Chọn phim</li>
            <li>Chọn suất chiếu</li>
            <li>Chọn ghế</li>
            <li className="active">Thanh toán</li>
            <li>Xác nhận/in vé</li>
          </ol>
        </div>
        <div className="emp-loading">Đang tải thông tin...</div>
      </div>
    );
  }

  if (!booking) {
  return (
    <div className="emp-page">
      <div className="emp-header">
          <div className="flex items-center justify-between">
        <h1>Đặt vé cho khách</h1>
            <BackButton />
          </div>
        </div>
        <div className="emp-loading">Không tìm thấy thông tin đặt vé.</div>
      </div>
    );
  }

  const showtime = booking.showtime;
  const movie = showtime?.movie;
  const theater = showtime?.theater;
  const branch = showtime?.branch;

  const notificationBanner = notification ? (
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
  ) : null;

  if (booking.paymentStatus === 'completed') {
    return (
      <div className="emp-page">
        <div className="emp-header">
          <div className="flex items-center justify-between">
          <h1>Đặt vé cho khách</h1>
            <BackButton />
          </div>
          <ol className="emp-steps">
            <li>Chọn phim</li>
            <li>Chọn suất chiếu</li>
            <li>Chọn ghế</li>
            <li>Thanh toán</li>
            <li className="active">Xác nhận/in vé</li>
          </ol>
        </div>

        {notificationBanner}

        {printSuccess && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setPrintSuccess(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Đã in vé thành công
                </h3>
                <p className="text-gray-600 mb-6">
                  Vé đã được in thành công. Bạn có thể tiếp tục đặt vé cho khách hàng khác.
                </p>
                <button
                  onClick={handleBackToBooking}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Trở lại phòng đặt vé
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto mt-8">
          <div className="mb-6 flex justify-end">
            <button
              onClick={handlePrintTicket}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer className="h-5 w-5" />
              In Vé
            </button>
          </div>

          <div ref={printRef} className="emp-card" style={{ padding: 32 }}>
            <div className="ticket-container" style={{ maxWidth: '800px', margin: '0 auto', border: '2px solid #000', padding: '30px' }}>
              <div className="ticket-header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="ticket-title" style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                  VÉ XEM PHIM
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {branch?.name || 'Rạp chiếu phim'}
                </div>
              </div>

              {movie && (
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {movie.title}
                  </h2>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    Thời lượng: {movie.duration} phút
                  </p>
                </div>
              )}

              <div className="ticket-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                    Mã đặt vé
                  </div>
                  <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                    {booking._id.substring(0, 8).toUpperCase()}
                  </div>
                </div>

                {showtime && (
                  <>
                    <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                        Suất chiếu
                      </div>
                      <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                        {formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}
                      </div>
                    </div>

                    <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                        Ngày chiếu
                      </div>
                      <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                        {formatDate(showtime.startTime)}
                      </div>
                    </div>

                    {theater && (
                      <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                          Rạp
                        </div>
                        <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                          {theater.name}
                        </div>
                      </div>
                    )}

                    {branch && (
                      <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                          Chi nhánh
                        </div>
                        <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                          {branch.name}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                    Ghế
                  </div>
                  <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                    {booking.seats?.map(s => `${s.row}${s.number}`).join(', ') || '-'}
                  </div>
                </div>

                {booking.combos?.length > 0 && (
                  <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                      Combo
                    </div>
                    <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                      {booking.combos.map((c, idx) => (
                        <div key={idx}>
                          {c.combo?.name || 'Combo'} x {c.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {booking.voucher && (
                  <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                      Voucher
                    </div>
                    <div className="info-value" style={{ fontSize: '16px', marginTop: '5px' }}>
                      {booking.voucher.code || booking.voucher}
                    </div>
                  </div>
                )}

                {booking.discountAmount > 0 && (
                  <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                      Giảm giá
                    </div>
                    <div className="info-value" style={{ fontSize: '16px', marginTop: '5px', color: '#10b981' }}>
                      -{booking.discountAmount.toLocaleString()}đ
                    </div>
                  </div>
                )}

                <div className="info-item" style={{ padding: '10px', borderBottom: '1px solid #ddd', gridColumn: '1 / -1' }}>
                  <div className="info-label" style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>
                    Tổng tiền
                  </div>
                  <div className="info-value" style={{ fontSize: '20px', marginTop: '5px', fontWeight: 'bold', color: '#dc2626' }}>
                    {booking.totalAmount.toLocaleString()}đ
                  </div>
                </div>
              </div>

              <div className="ticket-footer" style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #000', fontSize: '12px', color: '#666' }}>
                <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                <p style={{ marginTop: '5px' }}>Vui lòng giữ vé để kiểm tra khi vào rạp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (booking.paymentMethod === 'cash') {
  return (
    <div className="emp-page">
      <div className="emp-header">
          <div className="flex items-center justify-between">
            <h1>Đặt vé cho khách</h1>
            <BackButton />
          </div>
          <ol className="emp-steps">
            <li>Chọn phim</li>
            <li>Chọn suất chiếu</li>
            <li>Chọn ghế</li>
            <li className="active">Thanh toán</li>
            <li>Xác nhận/in vé</li>
          </ol>
        </div>

        {notificationBanner}

        <div className="max-w-2xl mx-auto mt-8">
          <div className="emp-card" style={{ padding: 32, textAlign: 'center' }}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Khách hàng đã thanh toán?
            </h2>
            
            <div className="space-y-4 mt-8">
              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6" />
                    Xác Nhận Thanh Toán
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancelBooking}
                disabled={processing}
                className="w-full bg-red-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    Chưa thanh toán
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="emp-header mb-6">
          <div className="flex items-center justify-between">
        <h1>Đặt vé cho khách</h1>
            <BackButton />
          </div>
        <ol className="emp-steps">
          <li>Chọn phim</li>
          <li>Chọn suất chiếu</li>
          <li>Chọn ghế</li>
            <li className="active">Thanh toán</li>
            <li>Xác nhận/in vé</li>
        </ol>
      </div>

        {notificationBanner}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin phim</h2>
              <div className="flex gap-4">
                {movie?.poster && (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-28 h-40 object-cover rounded"
                  />
                )}
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Tên phim:</span> {movie?.title || '-'}</div>
                  {movie?.duration && (
                    <div><span className="font-semibold">Thời lượng:</span> {movie.duration} phút</div>
                  )}
                  {showtime && (
                    <>
                      <div><span className="font-semibold">Suất chiếu:</span> {formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}</div>
                      <div><span className="font-semibold">Ngày chiếu:</span> {formatDate(showtime.startTime)}</div>
                    </>
                  )}
                  {theater && <div><span className="font-semibold">Rạp:</span> {theater.name}</div>}
                  {branch && <div><span className="font-semibold">Chi nhánh:</span> {branch.name}</div>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin đặt vé</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đặt vé:</span>
                  <span className="font-semibold">{booking._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ghế:</span>
                  <span className="font-semibold">{booking.seats?.map((s) => `${s.row}${s.number}`).join(', ') || '-'}</span>
                </div>
                {booking.combos?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Combo:</span>
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
                    <span>Giảm giá:</span>
                    <span className="font-semibold">-{booking.discountAmount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng tiền:</span>
                  <span>{booking.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái thanh toán:</span>
                  <span
                    className={`font-semibold ${
                      booking.paymentStatus === 'completed'
                        ? 'text-green-600'
                        : booking.paymentStatus === 'failed'
                        ? 'text-red-600'
                        : booking.paymentStatus === 'pending'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {booking.paymentStatus === 'completed'
                      ? 'Thành công'
                      : booking.paymentStatus === 'failed'
                      ? 'Thất bại'
                      : booking.paymentStatus === 'pending'
                      ? 'Đang xử lý'
                      : 'Chưa thanh toán'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái check-in:</span>
                  <span className={`font-semibold ${getCheckInStatus(booking).color}`}>
                    {getCheckInStatus(booking).label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thanh toán PayOS</h2>
              <p className="text-sm text-gray-600 mb-6">
                Nhấn “Tạo link PayOS” để lấy link thanh toán. Khi PayOS xác nhận thành công, hệ thống sẽ tự chuyển sang bước in vé.
              </p>

              <button
                onClick={handleGeneratePaymentLink}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo link…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Tạo link PayOS
                  </>
                )}
              </button>

              <div className="mt-6">
                {showQRCode && paymentUrl && (
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-blue-600 mb-4 text-center">Thông tin thanh toán</h3>
                    
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-lg mb-4">
                        <QRCodeSVG value={paymentUrl} size={280} />
                      </div>

                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-700 font-medium mb-2">
                          Cho khách quét mã QR bằng ứng dụng ngân hàng
                        </p>
                        <p className="text-xs text-gray-500">
                          hoặc nhấn nút bên dưới để mở trang thanh toán
                        </p>
                      </div>

                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 text-center transition-colors"
                      >
                        Mở trang thanh toán PayOS
                      </a>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg w-full border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Thông tin đơn hàng</h4>
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
                        Sau khi khách thanh toán thành công, trang sẽ tự động chuyển sang bước in vé.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


