import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, QrCode, ArrowLeft, Search, Camera, X } from 'lucide-react';
import jsQR from 'jsqr';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function CheckInPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [qrCodeData, setQrCodeData] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Update token when it changes in localStorage/sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      setToken(newToken);
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically
    const interval = setInterval(() => {
      const newToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (newToken !== token) {
        setToken(newToken);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  // Xử lý quét QR từ camera
  const scanQRFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Chỉ quét khi video đã sẵn sàng
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas kích thước bằng video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Vẽ frame hiện tại từ video lên canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Lấy image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Quét QR code
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        console.log('QR code detected:', code.data);
        // Tìm Booking ID từ QR code data
        const qrData = code.data;
        if (qrData) {
          setQrCodeData(qrData);
          handleScanQRWithData(qrData);
          stopCamera();
        }
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
    }
  };

  // Khởi động camera
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        console.log('Camera started successfully');

        // Bắt đầu scanning interval
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = setInterval(() => {
          scanQRFromCamera();
        }, 500);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      const message =
        error.name === 'NotAllowedError'
          ? 'Không được phép truy cập camera. Vui lòng kiểm tra quyền truy cập'
          : 'Không thể truy cập camera. Vui lòng kiểm tra kết nối';
      showNotification(message, 'error');
    }
  };

  // Dừng camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Auto-start camera khi component mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Scan với dữ liệu QR code hoặc Booking ID
  const handleScanQRWithData = async (data = null) => {
    const dataToScan = data || qrCodeData.trim();
    if (!dataToScan) {
      setNotification({ type: 'error', message: 'Vui lòng quét QR code hoặc nhập Booking ID' });
      return;
    }

    setLoading(true);
    setNotification(null);
    setBooking(null);

    try {
      if (!token) {
        setNotification({ type: 'error', message: 'Bạn cần đăng nhập để quét mã. Vui lòng đăng nhập tài khoản nhân viên.' });
        setLoading(false);
        return;
      }

      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/bookings/checkin/qr`, { qrCodeData: dataToScan }, headers);

      if (response.data.success) {
        setBooking(response.data.booking);
        setNotification({ type: 'success', message: 'Đã phát hiện QR code!' });
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không tìm thấy thông tin vé';
      setNotification({ type: 'error', message });
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = async () => {
    await handleScanQRWithData();
  };

  const handleCheckIn = async () => {
    if (!booking || !qrCodeData.trim()) {
      return;
    }

    setProcessing(true);
    setNotification(null);

    try {
      if (!token) {
        setNotification({ type: 'error', message: 'Bạn cần đăng nhập để quét mã. Vui lòng đăng nhập tài khoản nhân viên.' });
        setProcessing(false);
        return;
      }

      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/bookings/checkin/confirm`, { qrCodeData: qrCodeData.trim() }, headers);

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Check-in thành công!' });
        setBooking(response.data.booking);
        // Clear sau 3 giây để scan vé tiếp theo
        setTimeout(() => {
          setQrCodeData('');
          setBooking(null);
          setNotification(null);
        }, 3000);
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Check-in thất bại';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="h-8 w-8 text-blue-600" />
            Check-in Vé
          </h1>
          <p className="text-gray-600 mt-2">Quét QR code trên vé để check-in khách hàng</p>
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
          {/* Left: Camera QR Code Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Quét QR Code Vé
            </h2>
            
            <div className="space-y-4">
              {/* Camera Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📱 Camera Máy
                </label>
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />

                  {/* Scan Frame Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Corner Marks */}
                    <div className="absolute inset-0">
                      {/* Top-left */}
                      <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-green-500" />
                      {/* Top-right */}
                      <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-green-500" />
                      {/* Bottom-left */}
                      <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-green-500" />
                      {/* Bottom-right */}
                      <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-green-500" />
                    </div>

                    {/* Center Dot */}
                    <div className="absolute w-1 h-1 bg-green-500 rounded-full" />

                    {/* Animated Scanning Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-green-500 to-transparent animate-pulse" />
                  </div>

                  {/* Loading Indicator */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3" />
                        <p>⏳ Camera đang khởi động...</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  🔄 Đang quét QR code...
                </p>
              </div>

              {/* Booking ID Input Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Hoặc nhập Booking ID
                </label>
                <input
                  type="text"
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && qrCodeData.trim()) {
                      handleScanQR();
                    }
                  }}
                  placeholder="Nhập Booking ID hoặc QR code data"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập Booking ID trực tiếp hoặc đợi camera tự động quét
                </p>
              </div>

              <button
                onClick={handleScanQR}
                disabled={loading || !qrCodeData.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang tìm kiếm...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Tìm Kiếm Vé
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Booking Details */}
          {booking && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin Vé</h2>
              
              <div className="space-y-4">
                {/* Movie Info */}
                {booking.showtime?.movie && (
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {booking.showtime.movie.poster && (
                      <img 
                        src={booking.showtime.movie.poster} 
                        alt={booking.showtime.movie.title} 
                        className="w-20 h-28 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{booking.showtime.movie.title}</h3>
                      <p className="text-sm text-gray-600">Thời lượng: {booking.showtime.movie.duration} phút</p>
                    </div>
                  </div>
                )}

                {/* Booking Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Mã đặt vé:</span>
                    <span className="font-semibold">{booking._id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Suất chiếu:</span>
                    <span className="font-semibold">
                      {formatTime(booking.showtime?.startTime)} - {formatTime(booking.showtime?.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Ngày:</span>
                    <span className="font-semibold">{formatDate(booking.showtime?.startTime)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Rạp:</span>
                    <span className="font-semibold">{booking.showtime?.theater?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Chi nhánh:</span>
                    <span className="font-semibold">{booking.showtime?.branch?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Ghế:</span>
                    <span className="font-semibold">
                      {booking.seats?.map(s => `${s.row}${s.number}`).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Trạng thái thanh toán:</span>
                    <span className={`font-semibold ${
                      booking.paymentStatus === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {booking.paymentStatus === 'completed' ? 'Đã thanh toán' : booking.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Trạng thái check-in:</span>
                    <span className={`font-semibold ${
                      booking.checkedIn ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {booking.checkedIn ? 'Đã check-in' : 'Chưa check-in'}
                    </span>
                  </div>
                  {booking.checkedIn && booking.checkedInAt && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Check-in lúc:</span>
                      <span className="font-semibold">{formatDate(booking.checkedInAt)}</span>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                {booking.user && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
                    <div className="text-sm space-y-1">
                      <div>Họ tên: {booking.user.name}</div>
                      <div>Email: {booking.user.email}</div>
                      {booking.user.phone && <div>SĐT: {booking.user.phone}</div>}
                    </div>
                  </div>
                )}

                {/* Check-in Button */}
                {!booking.checkedIn && booking.paymentStatus === 'completed' && (
                  <button
                    onClick={handleCheckIn}
                    disabled={processing}
                    className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Xác nhận Check-in
                      </>
                    )}
                  </button>
                )}

                {booking.checkedIn && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Đã check-in</span>
                    </div>
                    {booking.checkedInAt && (
                      <p className="text-sm text-green-700 mt-1">
                        Check-in lúc: {formatDate(booking.checkedInAt)}
                      </p>
                    )}
                  </div>
                )}

                {booking.paymentStatus !== 'completed' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Không thể check-in</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Vé chưa được thanh toán thành công
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

