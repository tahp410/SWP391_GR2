import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Star, Calendar, Clock, MapPin, X } from 'lucide-react';
import Header from './Header';
import '../style/moviesPage.css';

const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  // Fetch movies
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/movies');
      if (response.ok) {
        const data = await response.json();
        setMovies(data);
        setFilteredMovies(data);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search movies
  const searchMovies = useCallback(async (term) => {
    if (!term.trim()) {
      setFilteredMovies(movies);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/movies/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredMovies(data);
      }
    } catch (error) {
      console.error('Error searching movies:', error);
    }
  }, [movies]);

  // Filter movies
  const filterMovies = useCallback(() => {
    let filtered = movies;

    if (selectedGenre) {
      filtered = filtered.filter(movie => {
        // Handle both array and string genre formats
        if (Array.isArray(movie.genre)) {
          return movie.genre.includes(selectedGenre);
        }
        return movie.genre === selectedGenre;
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(movie => movie.status === selectedStatus);
    }

    setFilteredMovies(filtered);
  }, [movies, selectedGenre, selectedStatus]);

  // Fetch showtimes for selected movie
  const fetchShowtimes = async (movieId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/showtimes/movie/${movieId}`);
      if (response.ok) {
        const data = await response.json();
        setShowtimes(data);
      }
    } catch (error) {
      console.error('Error fetching showtimes:', error);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchMovies(term);
  };

  // Handle movie selection
  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    fetchShowtimes(movie._id || movie.id);
  };

  // Close modal
  const closeModal = () => {
    setSelectedMovie(null);
    setShowtimes([]);
  };

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    filterMovies();
  }, [filterMovies]);

  // Get unique genres and statuses
  const genres = [...new Set(
    movies.flatMap(movie => {
      // Handle both array and string genre formats
      if (Array.isArray(movie.genre)) {
        return movie.genre;
      }
      return [movie.genre];
    })
  )];
  const statuses = [...new Set(movies.map(movie => movie.status))];

  if (loading) {
    return (
      <div className="movies-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách phim...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="movies-page">
      {/* Header */}
      <Header />

      {/* Header Section */}
      <div className="movies-header">
        <div className="container">
          <h1>Khám phá bộ sưu tập phim</h1>
          <p>Tìm kiếm và đặt vé cho những bộ phim hay nhất</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="container">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <Filter className="filter-icon" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="">Tất cả thể loại</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <Calendar className="filter-icon" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="movies-content">
        <div className="container">
          <div className="movies-grid">
            {filteredMovies.map(movie => (
              <div key={movie._id || movie.id} className="movie-card">
                <div className="movie-poster">
                  <img
                    src={movie.poster || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image'}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image';
                    }}
                    loading="lazy"
                  />
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.title}</h3>
                  <p className="movie-card-genre">{movie.genre}</p>
                  <div className="movie-card-rating">
                    <Star className="star-icon" size={16} />
                    <span>{movie.rating || 'N/A'}</span>
                  </div>
                  <div className="movie-card-buttons">
                    <button 
                      className="btn-view-details"
                      onClick={() => handleMovieSelect(movie)}
                    >
                      Xem chi tiết
                    </button>
                    <button 
                      className="btn-book-ticket"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Đặt vé
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div className="movie-modal-overlay" onClick={closeModal}>
          <div className="movie-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="modal-close-btn" onClick={closeModal}>
              <X size={24} />
            </button>
            
            <div className="movie-detail">
              <div className="movie-detail-poster">
                <img
                  src={selectedMovie.poster || 'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=No+Image'}
                  alt={selectedMovie.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=No+Image';
                  }}
                />
              </div>
              
              <div className="movie-detail-info">
                <h2>{selectedMovie.title}</h2>
                <p className="movie-detail-genre">
                  {Array.isArray(selectedMovie.genre) ? selectedMovie.genre.join(', ') : selectedMovie.genre}
                </p>
                <p className="movie-detail-description">{selectedMovie.description}</p>
                
                <div className="movie-detail-meta">
                  <div className="meta-item">
                    <Star className="meta-icon" />
                    <span>Đánh giá: {selectedMovie.rating || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <Clock className="meta-icon" />
                    <span>Thời lượng: {selectedMovie.duration || 'N/A'} phút</span>
                  </div>
                  <div className="meta-item">
                    <Calendar className="meta-icon" />
                    <span>Ngày phát hành: {new Date(selectedMovie.releaseDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {selectedMovie.endDate && (
                    <div className="meta-item">
                      <Calendar className="meta-icon" />
                      <span>Ngày kết thúc: {new Date(selectedMovie.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="movie-detail-additional">
                  {selectedMovie.director && (
                    <div className="additional-item">
                      <span className="additional-label">Đạo diễn:</span>
                      <span className="additional-value">{selectedMovie.director}</span>
                    </div>
                  )}
                  {selectedMovie.cast && Array.isArray(selectedMovie.cast) && selectedMovie.cast.length > 0 && (
                    <div className="additional-item">
                      <span className="additional-label">Diễn viên:</span>
                      <span className="additional-value">{selectedMovie.cast.join(', ')}</span>
                    </div>
                  )}
                  {selectedMovie.language && (
                    <div className="additional-item">
                      <span className="additional-label">Ngôn ngữ:</span>
                      <span className="additional-value">{selectedMovie.language}</span>
                    </div>
                  )}
                  {selectedMovie.status && (
                    <div className="additional-item">
                      <span className="additional-label">Trạng thái:</span>
                      <span className={`status-badge status-${selectedMovie.status}`}>
                        {selectedMovie.status === 'now-showing' ? 'Đang chiếu' : 
                         selectedMovie.status === 'coming-soon' ? 'Sắp chiếu' : 
                         selectedMovie.status === 'ended' ? 'Đã kết thúc' : selectedMovie.status}
                      </span>
                    </div>
                  )}
                  {selectedMovie.hotness && selectedMovie.hotness > 0 && (
                    <div className="additional-item">
                      <span className="additional-label">Độ nổi tiếng:</span>
                      <span className="additional-value">🔥 {selectedMovie.hotness}</span>
                    </div>
                  )}
                </div>

                {/* Showtimes */}
                {showtimes.length > 0 && (
                  <div className="showtimes-section">
                    <h3>Lịch chiếu:</h3>
                    <div className="showtimes-grid">
                      {showtimes.map((showtime, index) => (
                        <div key={showtime._id || showtime.id || index} className="showtime-card">
                          <div className="showtime-time">
                            <Clock className="time-icon" />
                            <span>{showtime.startTime}</span>
                          </div>
                          <div className="showtime-theater">
                            <MapPin className="location-icon" />
                            <span>{showtime.theaterName}</span>
                          </div>
                          <button 
                            className="book-button"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            Đặt vé
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                  {/* Action Buttons */}
                <div className="movie-detail-actions">
                  <button className="view-trailer-button" onClick={(e) => {
                    e.stopPropagation();
                    if (selectedMovie.trailer) {
                      window.open(selectedMovie.trailer, '_blank');
                    } else {
                      alert('Trailer chưa có sẵn');
                    }
                  }}>
                    Xem trailer
                  </button>
                  <button className="book-ticket-button" onClick={(e) => {
                    e.stopPropagation();
                  }}>
                    Đặt vé
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
