// Users.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Records() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Registros</h1>
    </div>
  );
}

export default Records;