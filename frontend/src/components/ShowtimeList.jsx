import React, { useEffect, useState } from "react";
import Header from "./Header";
import "../style/showtimes.css";

const ShowtimeList = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/showtimes/public");
        const data = await res.json();
        setShowtimes(data);
      } catch (err) {
        console.error("Error fetching showtimes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowtimes();
  }, []);

  if (loading) {
    return (
      <div className="cgv-container showtime-loading">
        <Header />
        <div className="loading-text">Đang tải lịch chiếu...</div>
      </div>
    );
  }

  if (showtimes.length === 0) {
    return (
      <div className="cgv-container showtime-empty">
        <Header />
        <div className="empty-text">Hiện chưa có lịch chiếu nào!</div>
      </div>
    );
  }

  return (
    <div className="cgv-container">
      <Header />
      <main className="showtime-content">
        <div className="section-header">
          <div className="section-icon showing-icon">🎬</div>
          <div>
            <h2>Lịch Chiếu Phim</h2>
            <p>Chọn suất chiếu phù hợp để trải nghiệm điện ảnh đỉnh cao</p>
          </div>
        </div>

        <div className="showtime-grid">
          {showtimes.map((item) => (
            <div key={item._id} className="showtime-card">
              <div className="showtime-poster">
                <img
                  src={
                    item.movie?.poster ||
                    "https://via.placeholder.com/400x600?text=No+Poster"
                  }
                  alt={item.movie?.title}
                />
              </div>
              <div className="showtime-info">
                <h3>{item.movie?.title}</h3>
                <p className="movie-genre">{item.movie?.genre?.join(", ")}</p>
                <p>
                  <strong>Rạp:</strong> {item.theater?.name || "—"}
                </p>
                <p>
                  <strong>Chi nhánh:</strong> {item.branch?.name || "—"}
                </p>
                <p>
                  <strong>Giờ chiếu:</strong>{" "}
                  {new Date(item.startTime).toLocaleString("vi-VN")}
                </p>
                <p>
                  <strong>Giá vé:</strong>{" "}
                  {item.price?.standard
                    ? `${item.price.standard.toLocaleString("vi-VN")}₫`
                    : "—"}
                </p>

                <button className="book-btn">Đặt vé ngay</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ShowtimeList;
