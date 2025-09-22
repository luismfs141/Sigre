// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import loginImage from '../assetss/resources/images/login-image.jpg';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <section className="vh-100">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-9 px-0 d-none d-sm-block">
            <img
              src={loginImage}
              alt="Login"
              className="w-100 vh-100"
              style={{ objectFit: 'cover', objectPosition: 'left' }}
            />
          </div>
          <div className="col-sm-3 text-black d-flex align-items-center justify-content-center min-vh-100">
            <div className="px-4 w-100">
              <div className="text-center mb-4">
                <i className="bi bi-person-circle fs-1 text-primary"></i>
                <h1 className="fw-bold mb-0">SigreWeb</h1>
              </div>
              <form onSubmit={handleLogin}>
                <h3 className="fw-normal mb-3 pb-3 text-center" style={{ letterSpacing: 1 }}>Iniciar sesión</h3>

                <div className="form-outline mb-4">
                  <input
                    type="text"
                    id="username"
                    className="form-control form-control-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <label className="form-label" htmlFor="username">Usuario</label>
                </div>

                <div className="form-outline mb-4">
                  <input
                    type="password"
                    id="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label className="form-label" htmlFor="password">Contraseña</label>
                </div>

                <div className="pt-1 mb-4">
                  <button type="submit" className="btn btn-primary btn-lg w-100">Entrar</button>
                </div>
              </form>
            </div>
          </div>
          </div>
        </div>
    </section>
  );
};

export default Login;