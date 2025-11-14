import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function EmployeeBookTicket() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/movies`);
        setMovies(Array.isArray(data) ? data : []);
      } catch {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="emp-page">
        <div className="emp-header">
          <h1>Đặt vé cho khách</h1>
        </div>
        <div className="emp-loading">Đang tải phim...</div>
      </div>
    );
  }

  return (
    <div className="emp-page">
      <div className="emp-header">
        <h1>Đặt vé cho khách</h1>
        <ol className="emp-steps">
          <li className="active">Chọn phim</li>
          <li>Chọn suất chiếu</li>
          <li>Chọn ghế</li>
          <li>Thanh toán</li>
          <li>Xác nhận/in vé</li>
        </ol>
      </div>

      <h2 className="emp-section-title">Chọn phim</h2>
      <div className="emp-grid">
        {movies.map((m) => (
          <button
            key={m._id}
            className="emp-card"
            onClick={() => navigate(`/employee/booking/${m._id}`)}
            title={m.title}
          >
            <div className="emp-card-thumb">
              <img src={m.poster} alt={m.title} />
            </div>
            <div className="emp-card-body">
              <div className="emp-card-title">{m.title}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


