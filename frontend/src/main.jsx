const React = require('react');
const ReactDOM = require('react-dom/client');
const App = require('./App');
const { AuthProvider } = require('./context/AuthContext');
const { BrowserRouter, Routes, Route } = require('react-router-dom');

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