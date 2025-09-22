import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './assetss/css/App.css';
import { Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Maps from './pages/Maps';
import Reports from './pages/Reports';
import Records from './pages/Records';
import Feeders from './pages/Elements/Feeders';
import Gaps from './pages/Elements/Gaps';
import Posts from './pages/Elements/Posts';
import Codes from './pages/Codes';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Login />} />

      {/* Rutas privadas con layout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/records" element={<Records />} />
        <Route path="/feeders" element={<Feeders />} />
        <Route path="/gaps" element={<Gaps />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/codes" element={<Codes />} />
      </Route>
    </Routes>
  );
}

export default App;