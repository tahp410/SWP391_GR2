import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function PaymentCancel() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prev = params.get('prev');
    const back = params.get('back');
    const bookingId = params.get('bookingId');
    const from = params.get('from');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    const proceedNavigate = () => {
      if (back) {
        const backUrl = back.includes('?') ? `${back}&fromCancel=1` : `${back}?fromCancel=1`;
        return navigate(backUrl, { replace: true });
      }
      if (prev) {
        const prevUrl = prev.includes('?') ? `${prev}&fromCancel=1` : `${prev}?fromCancel=1`;
        return navigate(prevUrl, { replace: true });
      }
      if (from === 'employee') {
        return navigate('/employee', { replace: true });
      }
      return navigate('/', { replace: true });
    };

    const cancelIfNeeded = async () => {
      if (bookingId && token) {
        try {
          await axios.post(
            `${API_BASE}/bookings/payment/cancel`,
            { bookingId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          // ignore errors; still navigate back
        }
      }
      proceedNavigate();
    };

    cancelIfNeeded();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đã hủy thanh toán, đang quay lại trang trước...</p>
      </div>
    </div>
  );
}


