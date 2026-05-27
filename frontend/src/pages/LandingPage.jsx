import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/landingpage.jpg';
import standardImg from '../assets/standard_layout.jpg';
import vipImg from '../assets/vip.jpg';
import privateImg from '../assets/private_lounge.jpg';

const LandingPage = () => {
  useEffect(() => {
    document.title = "BlackByte Cybercafe | Premium Esports Lounge & Gaming Sanctuary";

    // Set body background to deep dark to eliminate any white footer gaps
    const originalBg = document.body.style.background;
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.background = '#06060c';
    document.body.style.backgroundColor = '#06060c';

    return () => {
      // Restore original backgrounds when navigating away
      document.body.style.background = originalBg;
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="logo-container">
          <img src={logoImg} alt="BlackByte Logo" className="landing-brand-logo" />
          <span className="brand-name">BLACKBYTE</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="enter-portal-btn">ENTER PORTAL</Link>
        </div>
      </nav>

      {/* Full-bleed Centered Hero Section */}
      <header className="landing-hero-fullscreen" style={{
        backgroundImage: `radial-gradient(circle at center, rgba(10, 10, 20, 0.72) 0%, rgba(6, 6, 12, 0.95) 100%), url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="hero-content-centered">
          <div className="hero-badge">Esports-Grade Arena</div>
          <h1 className="hero-title-centered">
            THE ULTIMATE <br />
            <span className="gradient-text-centered">GAMING SANCTUARY</span>
          </h1>
          <p className="hero-description-centered">
            Experience gaming at its absolute peak. Reserve elite battle stations configured for competitive gaming, solo performance, and tactical team play.
          </p>
          <div className="hero-actions-centered">
            <Link to="/login" className="hero-primary-btn-centered">SECURE YOUR STATION</Link>
          </div>
        </div>
      </header>

      {/* Stats Ribbon */}
      <section className="landing-stats">
        <div className="stat-box">
          <span className="stat-number">50+</span>
          <span className="stat-label">Elite Workstations</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">360Hz</span>
          <span className="stat-label">VIP Displays</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">99.9%</span>
          <span className="stat-label">Session Uptime</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">24/7</span>
          <span className="stat-label">Tactical Support</span>
        </div>
      </section>

      {/* Alternating Showcase Rows */}
      <section className="landing-showcase-section">
        <div className="showcase-header">
          <h2 className="showcase-title">CHOOSE YOUR BATTLEGROUND</h2>
          <p className="showcase-subtitle">Select from three distinct gaming environments tailored to your competitive style</p>
        </div>

        <div className="showcase-rows-container">
          {/* Row 1: Standard (Left Image, Right Text) */}
          <article className="showcase-row left-image">
            <div className="showcase-image-wrapper">
              <img src={standardImg} alt="Standard Lounge" className="showcase-row-image" />
              <div className="showcase-badge-overlay">STANDARD</div>
            </div>
            <div className="showcase-content-wrapper">
              <span className="showcase-meta-code">01 / TIER I</span>
              <h3 className="showcase-row-title">Standard Lounge</h3>
              <p className="showcase-row-description">
                High-performance gaming setups designed for seamless responsiveness and competitive standard gameplay. Equipped with tournament-ready peripherals and fast network response.
              </p>
              <div className="showcase-row-tags">
                <span className="showcase-tag-item">GTX / RTX GPU</span>
                <span className="showcase-tag-item">Core i7 / Ryzen 7</span>
                <span className="showcase-tag-item">144Hz Display</span>
                <span className="showcase-tag-item">Pro Gear</span>
              </div>
            </div>
          </article>

          {/* Row 2: VIP (Right Image, Left Text) */}
          <article className="showcase-row right-image">
            <div className="showcase-content-wrapper">
              <span className="showcase-meta-code">02 / TIER II</span>
              <h3 className="showcase-row-title">VIP Lounge</h3>
              <p className="showcase-row-description">
                Step up to private pods, ultra-tier mechanical interfaces, extreme refresh displays, and ergonomic seating. Engineered for competitive players seeking maximum gaming performance.
              </p>
              <div className="showcase-row-tags">
                <span className="showcase-tag-item">RTX 4090 / 4080</span>
                <span className="showcase-tag-item">360Hz Display</span>
                <span className="showcase-tag-item">Hi-Fi Audio</span>
                <span className="showcase-tag-item">Ergo Seats</span>
              </div>
            </div>
            <div className="showcase-image-wrapper">
              <img src={vipImg} alt="VIP Lounge" className="showcase-row-image" />
              <div className="showcase-badge-overlay premium">VIP</div>
            </div>
          </article>

          {/* Row 3: VIP Room (Left Image, Right Text) */}
          <article className="showcase-row left-image">
            <div className="showcase-image-wrapper">
              <img src={privateImg} alt="VIP Room" className="showcase-row-image" />
              <div className="showcase-badge-overlay special">ROOM</div>
            </div>
            <div className="showcase-content-wrapper">
              <span className="showcase-meta-code">03 / SPECIAL</span>
              <h3 className="showcase-row-title">VIP Room</h3>
              <p className="showcase-row-description">
                Soundproof team rooms configured for local multiplayer clustering, team practice sessions, or streamers. Secure a private battle station for you and your squad to coordinate.
              </p>
              <div className="showcase-row-tags">
                <span className="showcase-tag-item">2-PC / 5-PC Suites</span>
                <span className="showcase-tag-item">Sound Isolated</span>
                <span className="showcase-tag-item">Giga LAN</span>
                <span className="showcase-tag-item">Squad Comms</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Arena Call to Action */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>READY TO ENTER THE ARENA?</h2>
          <p>Reserve your tactical setup, coordinate with your squad, and experience gaming at the ultimate tier.</p>
          <Link to="/login" className="cta-banner-btn">SECURE YOUR STATION NOW</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-copyright">&copy; {new Date().getFullYear()} BlackByte Cybercafe. Designed for the elite.</p>
          <div className="footer-status-tag">SYSTEM PORTALS ONLINE</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;