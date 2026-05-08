const Register = require('./components/Register');
const Layout = require('./components/Layout');
const Login = require('./components/Login');
const Dashboard = require('./components/Dashboard');
const Admin = require('./components/Admin');
const Unauthorized = require('./components/Unauthorized');
const Missing = require('./components/Missing');
const LinkPage = require('./components/LinkPage');
const { useContext } = require('react');
const { AuthContext } = require('./context/AuthContext');
const { Routes, Route } = require('react-router-dom');

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route path ="/login" element={<Login />} />
                <Route path ="/register" element={<Register />} />
                <Route path ="/unauthorized" element={<Unauthorized />} />
                <Route path ="/linkpage" element={<LinkPage />} />

                <Route path ="/dashboard" element={<Dashboard />} />
                <Route path ="/admin" element={<Admin />} />

                <Route path="*" element={<Missing />} />
            </Route>
        
        </Routes>
    );
};

module.exports = App;