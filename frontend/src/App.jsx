import AuthPage from './components/authPage';
import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Routes>
            <Route path="/" element={<AuthPage />} >
            </Route>       
        </Routes>
    );
};

export default App;