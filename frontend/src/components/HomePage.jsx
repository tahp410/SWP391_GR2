import React from 'react';
import Header from './Header';


const HomePage = () => {

  const movieData = {
    title: "Adventure Time",
    duration: "1h 30min",
    language: "English",
    subtitle: "Thai-Eng",
    rating: "PG-13",
    genre: "Animation"
  };

  const MovieCard = ({ movie, showTime }) => (
    <div className="movie-card">
      <div className="movie-poster">
        <img src="https://kenh14cdn.com/203336854389633024/2023/10/28/nvccspecial4x5-16984613995241980487333-16984631876291891509482.jpg" alt={movie.title} />
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <div className="movie-details">
          <span>{movie.duration}</span>
          <span>{movie.language}</span>
          <span>{movie.subtitle}</span>
        </div>
        <div className="movie-meta">
          <span className="rating">{movie.rating}</span>
          <span>{movie.genre}</span>
        </div>
        <div className="showtimes">
          <button className="showtime-btn">10:00</button>
          <button className="showtime-btn">13:30</button>
          <button className="showtime-btn">16:00</button>
          <button className="showtime-btn">19:30</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cgv-container">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Cinema Experience</h1>
            <p>Immerse yourself in the ultimate movie experience with premium comfort, cutting-edge technology, and the best blockbusters</p>
            <div className="hero-buttons">
              <button className="btn-primary">Explore Movies</button>
              <button className="btn-secondary">View Showtimes</button>
            </div>
          </div>
        </div>
        <div className="hero-background"></div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        {/* Trending Now */}
        <section className="movie-section">
          <div className="section-header">
            <div className="section-icon trending-icon">🔥</div>
            <div>
              <h2>Trending now</h2>
              <p>Currently playing in theaters</p>
            </div>
          </div>
          <div className="movies-grid">
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
          </div>
          <button className="see-all-btn">See all listing</button>
        </section>

        {/* Now Showing */}
        <section className="movie-section">
          <div className="section-header">
            <div className="section-icon showing-icon">🎬</div>
            <div>
              <h2>Now showing</h2>
              <p>Currently playing in theaters</p>
            </div>
          </div>
          <div className="movies-grid">
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
          </div>
          <button className="see-all-btn">See all listing</button>
        </section>

        {/* Recommended */}
        <section className="movie-section">
          <div className="section-header">
            <div className="section-icon recommended-icon">💜</div>
            <div>
              <h2>Recommended for you</h2>
              <p>Handpicked just for you</p>
            </div>
          </div>
          <div className="movies-grid">
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
            <MovieCard movie={movieData} />
          </div>
          <button className="see-all-btn">See all listing</button>
        </section>

        {/* Promotions */}
        <section className="promotions">
          <div className="promo-card student">
            <div className="promo-content">
              <h3>Student discount</h3>
              <p>Show your student ID and get 25% off on all movie tickets. Valid for all screenings on weekdays of the week.</p>
              <button className="promo-btn">Learn More</button>
            </div>
          </div>
          <div className="promo-card family">
            <div className="promo-content">
              <h3>Family package</h3>
              <p>Show your student ID and get 25% off on all movie tickets. Valid for all screenings on weekdays of the week.</p>
              <button className="promo-btn">Learn More</button>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="why-choose-us">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon premium">📺</div>
              <h3>Premium quality</h3>
              <p>Enjoy exceptional entertainment through advanced technology and the comfort of our premium seating and ambiance.</p>
            </div>
            <div className="feature">
              <div className="feature-icon booking">📅</div>
              <h3>Easy booking</h3>
              <p>Enjoy exceptional entertainment through advanced technology and the comfort of our premium seating and ambiance.</p>
            </div>
            <div className="feature">
              <div className="feature-icon price">💰</div>
              <h3>Best price</h3>
              <p>Enjoy exceptional entertainment through advanced technology and the comfort of our premium seating and ambiance.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <h2>Movie viewing color to your life</h2>
          <div className="cgv-logo-large">
            <img src="/" alt="CGV" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about">About CGV.com</a>
            <a href="#help">Help Center</a>
            <a href="#contact">Contact Us</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms & Conditions</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>CGV © 2024 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;