// Users.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Users() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Usuarios</h1>
    </div>
  );
}

export default Users;