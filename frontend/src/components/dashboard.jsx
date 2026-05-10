import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [token] = useState(localStorage.getItem('token'));
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState({
        username: 'User',
        availablePc: 0,
        totalBookedPc: 0
    });
    useEffect(() => {
         if(!token) {
                alert("No token found. Please log in.");
                return;
         }
         try{
            const historyResponse = await fetch('http://localhost:3000/src/reservationRoute/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            let historyCount = 0;
            if(historyResponse.ok) {
                const data = await historyResponse.json();
                setUserData(prevData => ({
                    ...prevData,
                    availablePc: data.availablePc,
                    totalBookedPc: data.totalBookedPc
                }));
            } else if(historyResponse.status === 401 || historyResponse.status === 403) {
                localStorage.removeItem('token');
                Navigate('/login');
            }
         } catch (error) {
            console.error("Error fetching dashboard data:", error);
         }
    });
    const fetchProtectedData = async () => {
        try {
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