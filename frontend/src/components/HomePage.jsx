import React, { useEffect, useState } from 'react';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { Film, Clock, Star, Calendar, TrendingUp, Sparkles } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const HomePage = () => {
  const [hotMovies, setHotMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalBranches: 0,
    activeShowtimes: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesRes, branchesRes, showtimesRes] = await Promise.all([
          fetch(`${API_BASE}/movies`).then(res => res.json()),
          fetch(`${API_BASE}/branches`).then(res => res.json()),
          fetch(`${API_BASE}/showtimes/public`).then(res => res.json()).catch(() => [])
        ]);

        const allMovies = Array.isArray(moviesRes) ? moviesRes : [];
        
        // Phân loại movies
        const hot = allMovies.filter(m => m.status === 'now-showing').slice(0, 6);
        const nowShowing = allMovies.filter(m => m.status === 'now-showing');
        const comingSoon = allMovies.filter(m => m.status === 'coming-soon').slice(0, 6);

        setHotMovies(hot);
        setNowShowingMovies(nowShowing);
        setComingSoonMovies(comingSoon);

        // Set stats
        setStats({
          totalMovies: allMovies.length,
          totalBranches: Array.isArray(branchesRes) ? branchesRes.length : 0,
          activeShowtimes: Array.isArray(showtimesRes) ? showtimesRes.length : 0
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const formatDuration = (min) => {
    const minutes = Number(min) || 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const MovieCard = ({ movie, showTime }) => (
    <div
      className="movie-card"
      onClick={() => navigate('/movies', { state: { showMovieId: movie._id } })}
      style={{ 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="movie-poster" style={{ position: 'relative' }}>
        <img 
          src={movie.poster || "https://via.placeholder.com/300x450?text=No+Poster"} 
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {movie.status === 'coming-soon' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Coming Soon
          </div>
        )}
        {movie.rating && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: '#ffd700',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Star size={14} fill="#ffd700" />
            {movie.rating}
          </div>
        )}
      </div>
      <div className="movie-info">
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {movie.title}
        </h3>
        <div className="movie-details" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '13px',
          color: '#666',
          marginBottom: '8px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} />
            {formatDuration(movie.duration)}
          </span>
          {movie.language && (
            <>
              <span>•</span>
              <span>{movie.language}</span>
            </>
          )}
        </div>
        {movie.genre && (
          <div className="movie-meta" style={{ marginBottom: '8px' }}>
            <span className="rating" style={{
              background: '#f0f0f0',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#333'
            }}>
              {movie.genre}
            </span>
          </div>
        )}
        <button 
          className="showtime-btn"
          style={{
            width: '100%',
            padding: '8px',
            background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          {movie.status === 'coming-soon' ? 'View Details' : 'Book Now'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="cgv-container">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="hero" style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        height: '500px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}>
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
            zIndex: 0
          }} 
        />
        <div className="hero-content" style={{ 
          position: 'relative', 
          zIndex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div className="hero-text" style={{ maxWidth: '800px', padding: '0 20px' }}>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(229, 9, 20, 0.3)'
            }}>
              Welcome to CineTicket
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#e0e0e0',
              marginBottom: '30px',
              lineHeight: '1.8'
            }}>
              Experience the magic of cinema with premium comfort, cutting-edge technology, 
              and unforgettable moments. Book your tickets now!
            </p>
            
            {/* Stats Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e50914' }}>
                  {stats.totalMovies}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Movies Available</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e50914' }}>
                  {stats.totalBranches}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Cinema Branches</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e50914' }}>
                  {stats.activeShowtimes}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Active Showtimes</div>
              </div>
            </div>

            <div className="hero-buttons" style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/movies')}
                style={{
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)'
                }}
              >
                🎬 Explore Movies
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/showtimes')}
                style={{
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: 'transparent',
                  border: '2px solid #e50914',
                  borderRadius: '8px',
                  color: '#e50914',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                📅 View Showtimes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
              <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading amazing content...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Trending Now */}
            <section className="movie-section">
              <div className="section-header" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px',
                marginBottom: '30px'
              }}>
                <div className="section-icon trending-icon" style={{
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                }}>
                  <TrendingUp size={32} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '5px' }}>
                    Trending Now
                  </h2>
                  <p style={{ color: '#666', fontSize: '1rem' }}>
                    {hotMovies.length} hot movies currently playing
                  </p>
                </div>
              </div>
              <div className="movies-grid">
                {hotMovies.length > 0 ? (
                  hotMovies.map((movie, idx) => <MovieCard key={movie._id || idx} movie={movie} />)
                ) : (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center',
                    padding: '40px',
                    background: '#f9f9f9',
                    borderRadius: '12px',
                    color: '#999'
                  }}>
                    <Film size={48} style={{ margin: '0 auto 15px' }} />
                    <p>No trending movies at the moment</p>
                  </div>
                )}
              </div>
              {hotMovies.length > 0 && (
                <button 
                  className="see-all-btn"
                  onClick={() => navigate('/movies')}
                  style={{
                    display: 'block',
                    margin: '30px auto 0',
                    padding: '12px 40px',
                    background: 'white',
                    border: '2px solid #e50914',
                    borderRadius: '8px',
                    color: '#e50914',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  See All Movies →
                </button>
              )}
            </section>

            {/* Now Showing */}
            <section className="movie-section">
              <div className="section-header" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px',
                marginBottom: '30px'
              }}>
                <div className="section-icon showing-icon" style={{
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  <Film size={32} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '5px' }}>
                    Now Showing
                  </h2>
                  <p style={{ color: '#666', fontSize: '1rem' }}>
                    {nowShowingMovies.length} movies currently in theaters
                  </p>
                </div>
              </div>
              <div className="movies-grid">
                {nowShowingMovies.length > 0 ? (
                  nowShowingMovies.slice(0, 6).map((movie, idx) => <MovieCard key={movie._id || idx} movie={movie} />)
                ) : (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center',
                    padding: '40px',
                    background: '#f9f9f9',
                    borderRadius: '12px',
                    color: '#999'
                  }}>
                    <Film size={48} style={{ margin: '0 auto 15px' }} />
                    <p>No movies showing at the moment</p>
                  </div>
                )}
              </div>
            </section>

            {/* Coming Soon */}
            {comingSoonMovies.length > 0 && (
              <section className="movie-section">
                <div className="section-header" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '30px'
                }}>
                  <div className="section-icon recommended-icon" style={{
                    fontSize: '2.5rem',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
                  }}>
                    <Sparkles size={32} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '5px' }}>
                      Coming Soon
                    </h2>
                    <p style={{ color: '#666', fontSize: '1rem' }}>
                      {comingSoonMovies.length} upcoming movies to look forward to
                    </p>
                  </div>
                </div>
                <div className="movies-grid">
                  {comingSoonMovies.map((movie, idx) => <MovieCard key={movie._id || idx} movie={movie} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* Promotions */}
        <section className="promotions" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          margin: '60px 0'
        }}>
          <div className="promo-card" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '40px',
            color: 'white',
            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.3s ease'
          }}>
            <div className="promo-content">
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎓</div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '15px' }}>
                Student Discount
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '20px', opacity: 0.9 }}>
                Show your student ID and get 25% off on all movie tickets. Valid for all screenings on weekdays.
              </p>
              <button 
                className="promo-btn"
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '12px 28px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="promo-card" style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '40px',
            color: 'white',
            boxShadow: '0 8px 30px rgba(240, 147, 251, 0.3)',
            transition: 'transform 0.3s ease'
          }}>
            <div className="promo-content">
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👨‍👩‍👧‍👦</div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '15px' }}>
                Family Package
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '20px', opacity: 0.9 }}>
                Buy 4 tickets and get special combo deals. Perfect for family movie nights and weekend fun!
              </p>
              <button 
                className="promo-btn"
                style={{
                  background: 'white',
                  color: '#f5576c',
                  padding: '12px 28px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="why-choose-us" style={{ margin: '60px 0' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            fontWeight: '700',
            marginBottom: '50px',
            background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Why Choose CineTicket?
          </h2>
          <div className="features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '40px'
          }}>
            <div className="feature" style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div className="feature-icon" style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                📺
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '15px' }}>
                Premium Quality
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Experience movies in stunning 4K resolution with Dolby Atmos sound system for immersive entertainment.
              </p>
            </div>
            <div className="feature" style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div className="feature-icon" style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                📅
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '15px' }}>
                Easy Booking
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Book your tickets online in just a few clicks. Choose your seats, time, and enjoy hassle-free experience.
              </p>
            </div>
            <div className="feature" style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div className="feature-icon" style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                💰
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '15px' }}>
                Best Price
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Get the best deals and exclusive discounts. Special offers for students, families, and members.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta" style={{ 
          width: '100%', 
          padding: '60px 20px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          textAlign: 'center',
          margin: '60px 0'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700',
            color: 'white',
            marginBottom: '20px'
          }}>
            Ready for the Ultimate Cinema Experience?
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#e0e0e0',
            marginBottom: '30px'
          }}>
            Book your tickets now and immerse yourself in the magic of movies!
          </p>
          <button
            onClick={() => navigate('/movies')}
            style={{
              padding: '16px 48px',
              fontSize: '1.1rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(229, 9, 20, 0.4)'
            }}
          >
            Book Now 🎬
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about">About CineTicket</a>
            <a href="#help">Help Center</a>
            <a href="#contact">Contact Us</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms & Conditions</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>CineTicket © 2024 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;