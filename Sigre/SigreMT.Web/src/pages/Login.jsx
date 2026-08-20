import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../hooks/useUsuario';

// --- PRIMEREACT IMPORTS ---
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';

const LoginForm = ({ onLogin }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const { loginUsuario, loading, error } = useUsuario();
    const navigate = useNavigate();
    const toast = useRef(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validación básica
        if (!usuario || !password) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Por favor completa todos los campos' });
            return;
        }

        try {
            // 1. Llamada a la API
            const data = await loginUsuario(usuario, password);

            // 2. Guardar sesión
            localStorage.setItem('usuario', JSON.stringify(data));

            // 3. ACTUALIZACIÓN DE ESTADO (SOLUCIÓN DEL BUG ANTERIOR)
            // Verificamos si onLogin existe antes de ejecutarlo para evitar el crash
            if (onLogin && typeof onLogin === 'function') {
                onLogin();
            }

            // 4. Redirección forzada
            // Usamos replace: true para que no puedan volver atrás al login
            navigate("/", { replace: true });

        } catch (err) {
            console.error('Error de login:', err);
            // El hook useUsuario probablemente ya maneja el estado 'error',
            // pero mostramos un toast por si acaso.
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Credenciales inválidas o error de conexión' });
        }
    };

    // Header para la tarjeta (Logo)
    const header = (
        <div className="flex justify-content-center pt-4">
             <img
                src={require('../assetss/img/logo.png')}
                alt="Arjen Login"
                style={{ maxWidth: '120px', display: 'block', margin: '0 auto' }}
            />
        </div>
    );

    return (
        <div className="flex align-items-center justify-content-center min-h-screen bg-blue-50">
            {/* Toast para notificaciones flotantes */}
            <Toast ref={toast} />

            <Card header={header} className="shadow-4 w-full md:w-30rem" style={{ borderRadius: '12px' }}>
                
                <div className="text-center mb-5">
                    <h2 className="text-900 text-2xl font-medium mb-1">Bienvenido</h2>
                    <span className="text-600 font-medium">Inicia sesión para continuar</span>
                </div>

                <form onSubmit={handleSubmit} className="p-fluid">
                    
                    {/* CAMPO USUARIO */}
                    <div className="field mb-4">
                        <span className="p-float-label">
                            <InputText 
                                id="usuario" 
                                value={usuario} 
                                onChange={(e) => setUsuario(e.target.value)} 
                                disabled={loading}
                            />
                            <label htmlFor="usuario">Usuario</label>
                        </span>
                    </div>

                    {/* CAMPO PASSWORD */}
                    <div className="field mb-4">
                        <span className="p-float-label">
                            <Password 
                                id="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                feedback={false} // Oculta la barra de fortaleza de contraseña
                                toggleMask       // Muestra el icono del "ojo"
                                disabled={loading}
                            />
                            <label htmlFor="password">Contraseña</label>
                        </span>
                    </div>

                    {/* MENSAJE DE ERROR (Si el hook lo devuelve) */}
                    {error && (
                        <div className="mb-3">
                            <Message severity="error" text={error} className="w-full" />
                        </div>
                    )}

                    {/* BOTÓN LOGIN */}
                    <Button 
                        label="Iniciar Sesión" 
                        icon="pi pi-sign-in" 
                        loading={loading} 
                        type="submit" 
                        className="w-full mt-2"
                    />

                </form>

                <div className="text-center mt-4 text-sm">
                    <span className="text-600">¿No tienes cuenta? </span>
                    <a href="/RegistroCliente" className="font-bold text-blue-500 hover:text-blue-700 no-underline">
                        Crea una cuenta aquí
                    </a>
                </div>
            </Card>
        </div>
    );
};

export default LoginForm;