import React from 'react';
import UserPurchaseHistory from '../UserPurchaseHistory';

export default function EmployeeBookings() {
  return (
    <div className="emp-page">
      <div className="emp-header">
        <h1>Danh sách vé đã đặt</h1>
      </div>
      <UserPurchaseHistory />
    </div>
  );
}


