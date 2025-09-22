// Users.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Feeders() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Subestaciones</h1>
    </div>
  );
}

export default Feeders;