import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../pictures/logo.png';
import bgImg from '../../pictures/landingpage.jpg';
const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="logo">
            <img src={logoImg} alt="BlackByte Logo" className="brand-logo" />
        </div>
        <div className="nav-links">
          <Link to="/login" className="login-btn">Sign In / Register</Link>
        </div>
      </nav>

      {/* Hero Section with Placeholder Background */}
      <header className="hero-section" style={{
          backgroundImage: `url(${bgImg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(0, 0, 0, 0.75)' // Keep this to darken the image so text remains readable
      }}>
        <div className="hero-content">
          <h1>Level Up Your Gaming Experience</h1>
          <p>Welcome to BlackByte, the premium cybercafe designed for hardcore gamers, esports enthusiasts, and squads.</p>
          <Link to="/login" className="cta-btn">Book Your PC Now</Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2>What We Offer</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🖥️ Standard Lounge</h3>
            <p>High-performance PCs equipped with Intel/Ryzen processors and GTX/RTX graphics cards. Perfect for casual and competitive gaming.</p>
          </div>
          <div className="feature-card">
            <h3>⭐ VIP Lounge</h3>
            <p>Experience ultra-smooth gameplay with premium setups, 240Hz monitors, and ergonomic gaming chairs in a dedicated quiet zone.</p>
          </div>
          <div className="feature-card">
            <h3>🔒 Private Suites</h3>
            <p>Bring your squad! Book a 2-PC or 5-PC private room for distraction-free team practices, LAN parties, or uninterrupted streaming.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} BlackByte Cybercafe. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;