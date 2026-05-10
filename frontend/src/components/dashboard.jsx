import { useState } from 'react';
import { checkAvailability, getHistory } from '../../../backend/src/routes/reservationRoute';
import { get } from '../../../backend/src/routes/authRoute';

const Dashboard = () => {
    const [token] = useState(localStorage.getItem('token'));
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState({
        username: '',
        availablePc: checkAvailability(),
        totalBookedPc: getHistory().length
    });
    const fetchProtectedData = async () => {
        try {
            if(!token) {
                alert("No token found. Please log in.");
                return;
            }
            const response = await fetch('http://localhost:3000/src/reservationRoute/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            console.log("Dashboard data:", data);      
        } catch (error) {
            console.error("Error fetching protected data:", error);
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <p>{message}</p>
            <button onClick={fetchProtectedData}>Fetch Protected Data</button>
        </div>
    );
};

export default Dashboard;