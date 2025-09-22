// Users.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Codes() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Códigos</h1>
    </div>
  );
}

export default Codes;