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

      {/* Hero Section - Modern Split Layout */}
      <header className="landing-hero">
        <div className="hero-text-pane">
          <div className="hero-badge">Esports-Grade Arena</div>
          <h1 className="hero-title">
            THE ULTIMATE <br />
            <span className="gradient-text">GAMING SANCTUARY</span>
          </h1>
          <p className="hero-description">
            Experience gaming at its absolute peak. Reserve elite battle stations configured for competitive gaming, solo performance, and tactical team play.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="hero-primary-btn">SECURE YOUR STATION</Link>
          </div>
        </div>
        <div className="hero-visual-pane">
          <div className="hero-glow-backplane"></div>
          <div className="hero-image-wrapper">
            <img src={bgImg} alt="Esports Gaming Setup" className="hero-main-image" />
            <div className="glass-overlay-card">
              <div className="status-indicator">
                <span className="pulse-dot"></span>
                <span>SYSTEMS ONLINE</span>
              </div>
              <div className="specs-minilist">
                <div className="spec-mini-item">RTX 4090 Equipped</div>
                <div className="spec-mini-item">360Hz Refresh Rate</div>
              </div>
            </div>
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
 
      {/* Choose Your Battleground Section */}
      <section className="landing-sectors">
        <div className="sectors-header">
          <h2 className="sectors-title">CHOOSE YOUR BATTLEGROUND</h2>
          <p className="sectors-subtitle">Select from three distinct gaming environments tailored to your gaming style</p>
        </div>
 
        <div className="sectors-grid">
          {/* Card 1: Standard */}
          <article className="sector-card vanguard">
            <div className="sector-image-container">
              <img src={standardImg} alt="Standard Lounge" className="sector-image" />
              <div className="sector-tag-chip">STANDARD</div>
            </div>
            <div className="sector-content">
              <div className="sector-meta">
                <span className="sector-code">01 / TIER I</span>
              </div>
              <h3 className="sector-name">Standard Lounge</h3>
              <p className="sector-desc">
                High-performance gaming setups designed for seamless responsiveness and competitive standard gameplay.
              </p>
              <div className="sector-tags">
                <span className="sector-spec">GTX / RTX GPU</span>
                <span className="sector-spec">Core i7 / Ryzen 7</span>
                <span className="sector-spec">144Hz Display</span>
                <span className="sector-spec">Pro Gear</span>
              </div>
            </div>
          </article>
 
          {/* Card 2: VIP */}
          <article className="sector-card apex">
            <div className="sector-image-container">
              <img src={vipImg} alt="VIP Lounge" className="sector-image" />
              <div className="sector-tag-chip premium">VIP</div>
            </div>
            <div className="sector-content">
              <div className="sector-meta">
                <span className="sector-code">02 / TIER II</span>
              </div>
              <h3 className="sector-name">VIP Lounge</h3>
              <p className="sector-desc">
                Step up to private pods, ultra-tier mechanical interfaces, extreme refresh displays, and ergonomic seating.
              </p>
              <div className="sector-tags">
                <span className="sector-spec">RTX 4090 / 4080</span>
                <span className="sector-spec">360Hz Display</span>
                <span className="sector-spec">Hi-Fi Audio</span>
                <span className="sector-spec">Ergo Seats</span>
              </div>
            </div>
          </article>
 
          {/* Card 3: VIP Room */}
          <article className="sector-card squad">
            <div className="sector-image-container">
              <img src={privateImg} alt="VIP Room" className="sector-image" />
              <div className="sector-tag-chip special">ROOM</div>
            </div>
            <div className="sector-content">
              <div className="sector-meta">
                <span className="sector-code">03 / SPECIAL</span>
              </div>
              <h3 className="sector-name">VIP Room</h3>
              <p className="sector-desc">
                Soundproof team rooms configured for local multiplayer clustering, team practice sessions, or streamers.
              </p>
              <div className="sector-tags">
                <span className="sector-spec">2-PC / 5-PC Suites</span>
                <span className="sector-spec">Sound Isolated</span>
                <span className="sector-spec">Giga LAN</span>
                <span className="sector-spec">Squad Comms</span>
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