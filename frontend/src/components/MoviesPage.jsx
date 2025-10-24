import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Clock, Calendar, Eye, Play } from 'lucide-react';
import Header from './Header';
import MovieDetail from './MovieDetail';
import '../style/moviesPage.css';

const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/movies`);
      if (response.ok) {
        const data = await response.json();
        setMovies(data);
      } else {
        console.error('Error fetching movies');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMovies = useCallback(
    async (term) => {
      if (!term.trim()) {
        fetchMovies();
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/movies/search?q=${encodeURIComponent(term)}`
        );
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
        } else {
          console.error('Error searching movies');
        }
      } catch (error) {
        console.error('Error searching movies:', error);
      }
    },
    [fetchMovies]
  );

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchMovies(searchTerm);
      } else {
        fetchMovies();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchMovies, fetchMovies]);

  const formatDuration = (min) => {
    const minutes = Number(min) || 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedMovie(null);
  };

  // Get unique genres from movies
  const genres = ['all', ...new Set(movies.map(movie => movie.genre).filter(Boolean))];

  // Filter movies based on search term, genre, and status
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.director?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.genre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = selectedGenre === 'all' || movie.genre === selectedGenre;
    const matchesStatus = selectedStatus === 'all' || movie.status === selectedStatus;
    
    return matchesSearch && matchesGenre && matchesStatus;
  });

  // Movie card component
  const MovieCard = ({ movie }) => (
    <div className="movie-card">
      <div className="movie-poster">
        <img
          src={movie.poster || "https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image"}
          alt={movie.title}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => handleMovieClick(movie)}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image";
          }}
        />
        <div className="movie-overlay" onClick={() => handleMovieClick(movie)}>
          <Play className="play-icon" />
        </div>
        {movie.hotness > 5 && (
          <div className="hot-badge">
            🔥 HOT
          </div>
        )}
      </div>
      <div className="movie-info">
        <h3 className="movie-title">
          {movie.title}
        </h3>
        <div className="movie-meta">
          <div className="movie-rating">
            <Clock size={16} className="clock-icon" />
            <span>{movie.rating || 'N/A'}</span>
          </div>
          <div className="movie-duration">
            <Clock size={16} className="clock-icon" />
            <span>{formatDuration(movie.duration)}</span>
          </div>
        </div>
        <div className="movie-genre">
          <span>{movie.genre}</span>
        </div>
        <div className="movie-status">
          <span className={`status-badge ${
            movie.status === 'now-showing' ? 'now-showing' :
            movie.status === 'coming-soon' ? 'coming-soon' :
            'ended'
          }`}>
            {movie.status === 'now-showing' ? 'Đang chiếu' :
             movie.status === 'coming-soon' ? 'Sắp chiếu' :
             'Đã kết thúc'}
          </span>
        </div>
        <button
          onClick={() => handleMovieClick(movie)}
          className="btn-primary"
        >
          <Eye size={16} />
          Xem chi tiết
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="movies-page">
        <Header />
        <div className="flex items-center justify-center min-h-96 movies-content">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white">Đang tải danh sách phim...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <Header />

      {/* Hero Section */}
      <section className="movies-hero">
        <div className="movies-hero-content">
          <h1>Khám phá bộ sưu tập phim</h1>
          <p>Tìm kiếm và khám phá những bộ phim hay nhất</p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-filter-section">
        <div className="container">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phim, đạo diễn, thể loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <Filter className="filter-icon" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="all">Tất cả thể loại</option>
                {genres.slice(1).map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="now-showing">Đang chiếu</option>
                <option value="coming-soon">Sắp chiếu</option>
                <option value="ended">Đã kết thúc</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Movies Section */}
      <section className="movies-section">
        <div className="container">
          <div className="section-header">
            <h2>Danh sách phim</h2>
            <p>Tìm thấy {filteredMovies.length} phim</p>
          </div>

          {filteredMovies.length > 0 ? (
            <div className="movies-grid">
              {filteredMovies.map((movie, index) => (
                <MovieCard key={movie._id || index} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="no-movies">
              <div className="no-movies-icon">🎬</div>
              <h3>Không tìm thấy phim nào</h3>
              <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </div>
      </section>

      {/* Movie Detail Modal */}
      {showDetail && selectedMovie && (
        <MovieDetail
          movie={selectedMovie}
          onClose={closeDetail}
        />
      )}
    </div>
  );
};

export default MoviesPage;