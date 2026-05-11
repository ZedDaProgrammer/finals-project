import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORT USEAUTH
import { useAuth } from '../../context/AuthContext'; 

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    try{
      const response = await fetch('http://localhost:3000/src/authRoute/login', {
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
        alert("Login Successful!");
        navigate('/dashboard');
      } else {
        alert(data.message || "Login failed");
      }

    } catch (error) {
      console.error("Error connecting to API:", error);
      alert("Server is down. Try again later.");
    }
  };
  const handleRegister = async (e) => {
    e.preventDefault(); 

    try {
    
      const response = await fetch('http://localhost:3000/src/authRoute/register', {
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
        alert("Registration Successful!");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error connecting to API:", error);
      alert("Server is down. Try again later.");
    }
  };

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  return (
    <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
      
    
      <div className="form-container sign-up-container">

        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>
          <span>or use your email for registration</span>
          <input 
            type="text" 
            placeholder="Name" 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="email"
            placeholder="Email"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password"
            placeholder="Password"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
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
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
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