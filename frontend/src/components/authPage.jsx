import { useState } from 'react';

const AuthPage = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  return (
    <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
	<div class="form-container sign-up-container">
		<form action="registerform">
			<h1>Create Account</h1>
			<span>or use your email for registration</span>
			<input type="text" placeholder="Name" />
			<input type="email" placeholder="Email" />
			<input type="password" placeholder="Password" />
			<button>Sign Up</button>
		</form>
	</div>
	<div class="form-container sign-in-container">
		<form action="loginform">
			<h1>Sign in</h1>
			<input type="email" placeholder="Email" />
			<input type="password" placeholder="Password" />
			<a href="#">Forgot your password?</a>
			<button>Sign In</button>
		</form>
	</div>
	<div class="overlay-container">
		<div class="overlay">
			<div class="overlay-panel overlay-left">
				<h1>Hello, Guest!</h1>
				<p>Enter your personal details to create an account</p>
				<button className="ghost" onClick={handleSignInClick}>Sign In</button>
			</div>
			<div class="overlay-panel overlay-right">
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