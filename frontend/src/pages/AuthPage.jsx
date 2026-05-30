import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { API_URL } from '../config';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/landingpage.jpg';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showFeedback } = useFeedback();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [forgotData, setForgotData] = useState({
    username: '',
    email: '',
    newPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Converts email to lowercase upon submission
          email: loginData.email.toLowerCase().trim(),
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token);
        showFeedback('success', 'Login Successful!', () => navigate('/dashboard'));
      } else {
        showFeedback('error', data.message || "Login failed");
      }

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error connecting to API:", error);
      showFeedback('error', "Server is down. Try again later.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // QA CHECK: Validate username and email are not empty, and password is at least 6 characters.
    // This provides immediate client-side feedback and prevents redundant API traffic.
    if (!registerData.name.trim() || !registerData.email.trim()) {
      showFeedback('error', "Username and email fields are required.");
      return;
    }
    if (registerData.password.length < 6) {
      showFeedback('error', "Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Converts both username and email to lowercase upon submission
          username: registerData.name.toLowerCase().trim(),
          email: registerData.email.toLowerCase().trim(),
          password: registerData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showFeedback('success', "Registration Successful! Please sign in.", () => setActiveTab('login'));
      } else {
        showFeedback('error', data.message || "Registration failed");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error connecting to API:", error);
      showFeedback('error', "Server is down. Try again later.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    // QA CHECK: Validate username, email are not empty, and new password is at least 6 characters.
    // Enforces client-side validation before sending data to the server reset endpoint.
    if (!forgotData.username.trim() || !forgotData.email.trim()) {
      showFeedback('error', "Username and email fields are required.");
      return;
    }
    if (forgotData.newPassword.length < 6) {
      showFeedback('error', "New password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: forgotData.username.toLowerCase().trim(),
          email: forgotData.email.toLowerCase().trim(),
          newPassword: forgotData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showFeedback('success', "Password reset successful. Please sign in.", () => {
          setActiveTab('login');
          setForgotData({ username: '', email: '', newPassword: '' });
        });
      } else {
        showFeedback('error', data.message || "Password reset failed");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error connecting to API:", error);
      showFeedback('error', "Server is down. Try again later.");
    }
  };

  return (
    <div className="auth-page-wrapper" style={{
      // OPTIMIZATION: Replaced linear-gradient overlay with solid background color + multiply blend mode.
      // This applies a clean, flat dark-neutral tint (rgba(8, 8, 16, 0.88)) to keep text high contrast and readable.
      backgroundColor: 'rgba(8, 8, 16, 0.88)',
      backgroundImage: `url(${bgImg})`,
      backgroundBlendMode: 'multiply',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="auth-glass-card">
        {/* Header Logo */}
        <div className="auth-card-logo-container">
          <img src={logoImg} alt="BlackByte Logo" className="auth-card-logo" />
          <span className="auth-card-brand-name">BLACKBYTE</span>
        </div>

        {/* Tab Selector Header */}
        <div className="auth-tab-header">
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            SIGN IN
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            SIGN UP
          </button>
        </div>

        {/* Active Form */}
        <div className="auth-form-container">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form-active">
              <h2>Welcome Back</h2>
              <p className="auth-form-subtitle">Access your tactical profile</p>
              
              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              <div className="auth-extra-links">
                <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setActiveTab('forgot'); }}>Forgot password?</a>
              </div>

              <button type="submit" className="auth-submit-btn">ENTER PORTAL</button>
            </form>
          ) : activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="auth-form-active">
              <h2>Join the Arena</h2>
              <p className="auth-form-subtitle">Create your esports credentials</p>

              <div className="auth-input-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="gaming_legend"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn">CREATE PORTAL ACC</button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="auth-form-active">
              <h2>Reset Password</h2>
              <p className="auth-form-subtitle">Verify credentials to update password</p>

              <div className="auth-input-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="gaming_legend"
                  value={forgotData.username}
                  onChange={(e) => setForgotData({ ...forgotData, username: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={forgotData.newPassword}
                  onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="auth-extra-links">
                <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setActiveTab('login'); }}>Back to Sign In</a>
              </div>

              <button type="submit" className="auth-submit-btn">RESET PASSWORD</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;