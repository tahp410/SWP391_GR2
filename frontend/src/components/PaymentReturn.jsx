import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentReturn() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    const from = params.get('from');
    // PayOS may provide code/status as well, but webhook will finalize the status.
    if (bookingId) {
      if (from === 'employee') {
        navigate(`/employee/purchase/${encodeURIComponent(bookingId)}`, {
          replace: true,
          state: { fromPayOS: true },
        });
      } else {
        // Redirect to ticket detail page which shows QR when completed
        navigate(`/purchase/${encodeURIComponent(bookingId)}`, { replace: true });
      }
    } else {
      // Fallback: go to purchase history if bookingId is missing
      navigate('/purchase-history', { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý thanh toán, vui lòng đợi...</p>
      </div>
    </div>
  );
}


