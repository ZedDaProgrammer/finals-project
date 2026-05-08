const React = require('react');
const ReactDOM = require('react-dom/client');
const App = require('./App');
const { AuthProvider } = require('./context/AuthContext');
const { BrowserRouter, Routes, Route } = require('react-router-dom');
import React, { useState } from 'react';
import './Auth.css'; // Make sure your CSS file is imported!

const AuthPage = () => {

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);


  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  return (

    <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
      

      <div className="form-container sign-up-container">
        <form>
          <h1>Create Account</h1>

          <button type="button">Sign Up</button>
        </form>
      </div>


      <div className="form-container sign-in-container">
        <form>
          <h1>Sign in</h1>
   
          <button type="button">Sign In</button>
        </form>
      </div>


      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <button className="ghost" onClick={handleSignInClick}>Sign In</button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
    <AuthProvider>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
        <App />
    </AuthProvider>
    </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
);      