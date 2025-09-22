// Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}

export default Dashboard;