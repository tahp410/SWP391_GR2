import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function PurchasePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  // Check if coming from purchase history
  const isFromHistory = location.state?.fromHistory || 
                        new URLSearchParams(location.search).get('fromHistory') === 'true';
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', 'pending', null
  const [notification, setNotification] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [ticketQRCode, setTicketQRCode] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Auto refresh khi payment pending hoặc success nhưng chưa có ticketQRCode
  useEffect(() => {
    if (paymentStatus === 'pending' || (paymentStatus === 'success' && !ticketQRCode)) {
      const interval = setInterval(() => {
        fetchBooking();
      }, 3000); // Refresh mỗi 3 giây

      return () => clearInterval(interval);
    }
  }, [paymentStatus, ticketQRCode, bookingId]);

  const fetchBooking = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(data.booking);
      
      // Show payment QR code if exists and payment not completed
      if (data.booking.qrCode && data.booking.paymentStatus !== 'completed') {
        setQrCode(data.booking.qrCode);
        setShowQRCode(true);
      } else {
        setShowQRCode(false);
      }
      
      // Show ticket QR code if payment completed
      if (data.booking.ticketQRCode && data.booking.paymentStatus === 'completed') {
        console.log('Found ticket QR code:', data.booking.ticketQRCode.substring(0, 50) + '...');
        setTicketQRCode(data.booking.ticketQRCode);
      } else if (data.booking.paymentStatus === 'completed' && !data.booking.ticketQRCode) {
        console.log('Payment completed but ticketQRCode not found');
      }
      
      // Set bank info
      if (data.booking.totalAmount) {
        setBankInfo({
          accountName: "CINEMA BOOKING SYSTEM",
          accountNumber: "19036780036015",
          bankName: "Techcombank",
          amount: data.booking.totalAmount
        });
      }
      
      // Check payment status
      if (data.booking.paymentStatus === 'completed') {
        setPaymentStatus('success');
      } else if (data.booking.paymentStatus === 'pending') {
        setPaymentStatus('pending');
        if (data.booking.paymentMethod) {
          setPaymentMethod(data.booking.paymentMethod);
        }
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
  };

  // Step 1: Generate QR code when payment method is selected
  const handleGenerateQR = async () => {
    if (!paymentMethod) {
      setNotification({ type: 'error', message: 'Please select a payment method' });
      return;
    }

    setProcessing(true);
    setNotification(null);

    try {
      const response = await axios.post(
        `${API_BASE}/bookings/payment/qr`,
        {
          bookingId: bookingId,
          paymentMethod: paymentMethod
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setBankInfo(response.data.bankInfo);
        setShowQRCode(true);
        setBooking(response.data.booking);
        setNotification({ 
          type: 'success', 
          message: 'QR code generated. Please scan and complete the payment.' 
        });
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to generate QR code';
      setNotification({ 
        type: 'error', 
        message: message 
      });
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: User marks as purchased after scanning QR code
  const handleMarkAsPurchased = async () => {
    setProcessing(true);
    setNotification(null);

    try {
      const response = await axios.post(
        `${API_BASE}/bookings/payment/purchased`,
        { bookingId: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPaymentStatus('pending');
        setBooking(response.data.booking);
        setNotification({ 
          type: 'success', 
          message: 'Payment marked as purchased. Seats locked for 24 hours. Waiting for admin confirmation.' 
        });
        // Refresh booking to get updated status
        await fetchBooking();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to mark as purchased';
      setNotification({ 
        type: 'error', 
        message: message 
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancel payment - release seats and reset statuses
  const handleCancelPayment = async () => {
    if (!window.confirm('Are you sure you want to cancel the payment? This will release your seats.')) {
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
        setPaymentStatus(null);
        setBooking(response.data.booking);
        setNotification({ 
          type: 'success', 
          message: 'Payment cancelled. Seats released.' 
        });
        // Refresh booking to get updated status
        await fetchBooking();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to cancel payment';
      setNotification({ 
        type: 'error', 
        message: message 
      });
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
            onClick={() => navigate('/home')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Purchase Ticket</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
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
                    booking.bookingStatus === 'confirmed' ? 'text-green-600' :
                    booking.bookingStatus === 'cancelled' ? 'text-red-600' :
                    booking.bookingStatus === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {booking.bookingStatus === 'confirmed' ? 'Confirmed' :
                     booking.bookingStatus === 'cancelled' ? 'Cancelled' :
                     booking.bookingStatus === 'pending' ? 'Pending' :
                     'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code and Actions */}
          <div className="space-y-6">
            {/* QR Code Display - Next to Movie Info */}
            {showQRCode && qrCode && !isFromHistory && 
             paymentStatus !== 'completed' && paymentStatus !== 'success' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Scan QR Code to Transfer</h2>
                
                {/* Bank Account Info */}
                {bankInfo && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Quét mã để chuyển tiền đến</p>
                    <div className="text-lg font-bold text-gray-900 mb-1">{bankInfo.accountName}</div>
                    <div className="text-sm text-gray-700">{bankInfo.accountNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">{bankInfo.bankName}</div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Amount: </span>
                      <span className="text-lg font-bold text-blue-600">{bankInfo.amount.toLocaleString()}đ</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                    <img src={qrCode} alt="Payment QR Code" className="w-64 h-64" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-red-600 font-semibold">TECHCOMBANK</span>
                    <span className="text-red-600">VIETQR</span>
                    <span className="text-green-600">napas 247</span>
                  </div>
                </div>

                {/* Payment Made and Cancel Payment Buttons */}
                {paymentStatus !== 'completed' && paymentStatus !== 'success' && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleMarkAsPurchased}
                      disabled={processing || paymentStatus === 'pending'}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : paymentStatus === 'pending' ? 'Waiting for Admin Confirmation' : 'Payment Made'}
                    </button>
                    
                    {paymentStatus !== 'pending' && (
                      <button
                        onClick={handleCancelPayment}
                        disabled={processing || paymentStatus === 'completed' || paymentStatus === 'success'}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel Payment
                      </button>
                    )}
                    
                    {paymentStatus === 'pending' && (
                      <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-center text-yellow-800 font-semibold">
                          Waiting for admin confirmation. Seats are locked for 24 hours.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
