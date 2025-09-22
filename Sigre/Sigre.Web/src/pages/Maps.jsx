// Users.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Maps() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Mapas</h1>
    </div>
  );
}

export default Maps;