// Users.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Gaps() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Vanos</h1>
    </div>
  );
}

export default Gaps;