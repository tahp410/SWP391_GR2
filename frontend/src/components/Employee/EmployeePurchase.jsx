import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import PurchasePage from '../PurchasePage';
import '../../style/employee.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function EmployeePurchase() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [printSuccess, setPrintSuccess] = useState(false);
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

  const handleConfirmPayment = async () => {
    setProcessing(true);
    setNotification(null);

    try {
      const response = await axios.post(
        `${API_BASE}/bookings/payment/confirm-cash`,
        { bookingId: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({ 
          type: 'success', 
          message: 'Xác nhận thanh toán thành công!' 
        });
        // Refresh lại booking để hiển thị trang in vé
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
        { bookingId: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({ 
          type: 'success', 
          message: 'Đã hủy vé thành công' 
        });
        // Quay lại trang đặt vé sau 1 giây
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
    // Chỉ hiển thị modal thông báo thành công, không mở cửa sổ in
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
          <h1>Đặt vé cho khách</h1>
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

  // Nếu paymentMethod là cash và chưa thanh toán, hiển thị trang xác nhận
  if (booking && booking.paymentMethod === 'cash' && booking.paymentStatus !== 'completed') {
  return (
    <div className="emp-page">
      <div className="emp-header">
        <h1>Đặt vé cho khách</h1>
        <ol className="emp-steps">
          <li>Chọn phim</li>
          <li>Chọn suất chiếu</li>
          <li>Chọn ghế</li>
          <li className="active">Thanh toán</li>
          <li>Xác nhận/in vé</li>
        </ol>
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

  // Nếu đã thanh toán và là cash, hiển thị trang in vé
  if (booking && booking.paymentMethod === 'cash' && booking.paymentStatus === 'completed') {
    const showtime = booking.showtime;
    const movie = showtime?.movie;
    const theater = showtime?.theater;
    const branch = showtime?.branch;

    return (
      <div className="emp-page">
        <div className="emp-header">
          <h1>Đặt vé cho khách</h1>
          <ol className="emp-steps">
            <li>Chọn phim</li>
            <li>Chọn suất chiếu</li>
            <li>Chọn ghế</li>
            <li>Thanh toán</li>
            <li className="active">Xác nhận/in vé</li>
          </ol>
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

        {/* Print Success Modal */}
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
          {/* Nút IN Vé */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={handlePrintTicket}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer className="h-5 w-5" />
              In Vé
            </button>
          </div>

          {/* Nội dung vé để in */}
          <div ref={printRef} className="emp-card" style={{ padding: 32 }}>
            {/* Ticket Content */}
            <div className="ticket-container" style={{ maxWidth: '800px', margin: '0 auto', border: '2px solid #000', padding: '30px' }}>
              <div className="ticket-header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="ticket-title" style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                  VÉ XEM PHIM
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {branch?.name || 'Rạp chiếu phim'}
                </div>
              </div>

              {/* Movie Info */}
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

              {/* Booking Details */}
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

              {/* Footer */}
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

  // Nếu không phải cash hoặc chưa thanh toán, hiển thị trang mặc định (PurchasePage)
  return (
    <div className="emp-page">
      <div className="emp-header">
        <h1>Đặt vé cho khách</h1>
        <ol className="emp-steps">
          <li>Chọn phim</li>
          <li>Chọn suất chiếu</li>
          <li>Chọn ghế</li>
          <li>Thanh toán</li>
          <li className="active">Xác nhận/in vé</li>
        </ol>
      </div>
      {/* Hiển thị trang in vé */}
      <PurchasePage bookingId={bookingId} />
    </div>
  );
}


