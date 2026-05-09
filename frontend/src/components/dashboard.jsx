import { useState } from 'react';

const Dashboard = () => {
    const [message, setMessage] = useState('');
    const fetchProtectedData = async () => {
        try {
            const response = await fetch('http://localhost:3000/src/protectedRoute/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setMessage(data.message);
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