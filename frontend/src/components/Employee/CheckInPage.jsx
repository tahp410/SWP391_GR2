import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, QrCode, ArrowLeft, Search, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function CheckInPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [qrCodeData, setQrCodeData] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Xử lý paste ảnh từ clipboard
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          await handleImageFile(blob);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đọc QR code từ ảnh
  const readQRFromImage = (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        console.log('Image loaded for QR scan. Dimensions:', img.width, 'x', img.height);
        
        // Scale image nếu quá lớn để tăng tốc độ xử lý
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        console.log('ImageData created. Size:', width, 'x', height);
        
        try {
          const code = jsQR(imageData.data, width, height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            console.log('QR code found:', code.data);
            resolve(code.data);
          } else {
            console.log('No QR code found in image. Trying with inversion...');
            // Thử lại với inversion
            const codeInverted = jsQR(imageData.data, width, height, {
              inversionAttempts: "attemptBoth",
            });
            
            if (codeInverted) {
              console.log('QR code found with inversion:', codeInverted.data);
              resolve(codeInverted.data);
            } else {
              console.log('Still no QR code found after inversion attempts.');
              reject(new Error('Không tìm thấy QR code trong ảnh. Vui lòng thử ảnh khác hoặc nhập Booking ID trực tiếp.'));
            }
          }
        } catch (qrError) {
          console.error('Error during jsQR processing:', qrError);
          reject(new Error('Lỗi khi xử lý QR code từ ảnh.'));
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image for QR scan:', error);
        reject(new Error('Không thể tải ảnh.'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  };

  // Xử lý file ảnh
  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Vui lòng chọn file ảnh' });
      return;
    }

    setLoading(true);
    setNotification(null);
    
    // Cleanup preview cũ nếu có
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(previewUrl);

    try {
      const qrData = await readQRFromImage(file);
      setQrCodeData(qrData);
      setNotification({ type: 'success', message: 'Đã đọc QR code từ ảnh thành công!' });
      
      // Tự động scan sau khi đọc QR
      setTimeout(() => {
        handleScanQRWithData(qrData);
      }, 500);
    } catch (err) {
      setNotification({ 
        type: 'error', 
        message: err.message || 'Không thể đọc QR code từ ảnh. Vui lòng thử ảnh khác.' 
      });
      setSelectedImage(null);
      URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup khi component unmount hoặc khi xóa ảnh
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Xử lý chọn file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // Xử lý drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // Scan với dữ liệu QR code hoặc Booking ID
  const handleScanQRWithData = async (data = null) => {
    const dataToScan = data || qrCodeData.trim();
    if (!dataToScan) {
      setNotification({ type: 'error', message: 'Vui lòng nhập Booking ID hoặc upload ảnh QR code' });
      return;
    }

    setLoading(true);
    setNotification(null);
    setBooking(null);

    try {
      // Nếu là Booking ID ngắn (dưới 20 ký tự và không có dấu {} hoặc []), coi như Booking ID
      let qrDataToSend = dataToScan;
      
      // Nếu có vẻ như Booking ID (không phải JSON), thử parse thành JSON với bookingId
      if (dataToScan.length < 50 && !dataToScan.includes('{') && !dataToScan.includes('[')) {
        // Có thể là Booking ID trực tiếp
        console.log('Treating as Booking ID:', dataToScan);
      } else {
        // Có thể là JSON string từ QR code
        console.log('Treating as QR code data:', dataToScan);
      }

      const response = await axios.post(
        `${API_BASE}/bookings/checkin/qr`,
        { qrCodeData: qrDataToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setBooking(response.data.booking);
        setNotification({ 
          type: 'success', 
          message: 'Đã tìm thấy thông tin vé' 
        });
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
      const response = await axios.post(
        `${API_BASE}/bookings/checkin/confirm`,
        { qrCodeData: qrCodeData.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
          {/* Left: QR Code Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Quét QR Code
            </h2>
            
            <div className="space-y-4">
              {/* Upload ảnh Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ảnh QR Code
                </label>
                
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full max-h-48 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (imagePreview) {
                              URL.revokeObjectURL(imagePreview);
                            }
                            setSelectedImage(null);
                            setImagePreview(null);
                            setQrCodeData('');
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Kéo thả ảnh vào đây hoặc
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                      >
                        <Upload className="h-4 w-4" />
                        Chọn ảnh
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Hoặc paste ảnh (Ctrl+V / Cmd+V)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Booking ID Input Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoặc nhập Booking ID
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
                  placeholder="Nhập Booking ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Nhập Booking ID từ vé hoặc upload/paste ảnh QR code ở trên để tự động đọc
                </p>
              </div>

              <button
                onClick={handleScanQR}
                disabled={loading || (!qrCodeData.trim() && !selectedImage)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang quét...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Quét QR Code
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

