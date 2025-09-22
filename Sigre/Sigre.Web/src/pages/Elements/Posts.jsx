// Users.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Posts() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Postes</h1>
    </div>
  );
}

export default Posts;