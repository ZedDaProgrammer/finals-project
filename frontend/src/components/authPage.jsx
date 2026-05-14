import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { useFeedback } from '../../context/feedbackContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const { showFeedback } = useFeedback();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleLogin = async (e) => {
    e.preventDefault();

    try{
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token); 
        // Show success, and only navigate when "OK" is clicked
        showFeedback('success', 'Login Successful!', () => navigate('/dashboard'));
      } else {
        showFeedback('error', data.message || "Login failed");
      }

    } catch (error) {
      console.error("Error connecting to API:", error);
      showFeedback('error', "Server is down. Try again later.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success and slide the panel over to the login form
        showFeedback('success', "Registration Successful! Please sign in.", () => setIsRightPanelActive(false));
      } else {
        showFeedback('error', data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error connecting to API:", error);
      showFeedback('error', "Server is down. Try again later.");
    }
  };

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  return (
    <div className={`auth-container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
      <div className="form-container sign-up-container">
        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>
          <span>or use your email for registration</span>
          <input 
            type="text" 
            placeholder="Name" 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            type="email"
            placeholder="Email"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password"
            placeholder="Password"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div className="form-container sign-in-container">
        <form onSubmit={handleLogin}>
          <h1>Sign in</h1>
          <input 
            type="email" 
            placeholder="Email" 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <a href="#">Forgot your password?</a>
          <button type="submit">Sign In</button>
        </form>
      </div>

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Hello, Guest!</h1>
            <p>Enter your personal details to create an account</p>
            <button className="ghost" onClick={handleSignInClick}>Sign In</button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Welcome User</h1>
            <p>Fill in with your credentials to access your account</p>
            <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;