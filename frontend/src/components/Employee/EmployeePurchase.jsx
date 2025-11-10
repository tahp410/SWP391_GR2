import React from 'react';
import { useParams } from 'react-router-dom';
import PurchasePage from '../PurchasePage';
import '../../style/employee.css';

export default function EmployeePurchase() {
  const { bookingId } = useParams();
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
      {/* Reuse existing purchase UI but keep employee header visible */}
      <PurchasePage bookingId={bookingId} />
    </div>
  );
}


