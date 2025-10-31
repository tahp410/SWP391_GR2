import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/movies/${id}`);
        if (mounted) setMovie(data);
      } catch (e) {
        setError('Không tải được thông tin phim');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!movie) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <img src={movie.poster} alt={movie.title} className="w-full rounded" />
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
          <p className="text-sm text-gray-600 mb-2">Đạo diễn: {movie.director}</p>
          <p className="text-sm text-gray-600 mb-2">Diễn viên: {Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast}</p>
          <p className="text-sm text-gray-600 mb-2">Khởi chiếu: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : '-'}</p>
          <p className="text-sm text-gray-600 mb-2">Thời lượng: {movie.duration} phút</p>
          <p className="text-sm text-gray-600 mb-2">Ngôn ngữ: {movie.language}</p>
          <div className="my-4">{movie.description}</div>
          {movie.trailer ? (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                className="w-full h-64"
                src={movie.trailer}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          <button
            onClick={() => navigate(`/booking/${movie._id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Mua vé
          </button>
        </div>
      </div>
    </div>
  );
}


