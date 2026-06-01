import { useState } from 'react';
import { authAPI } from '../services/api';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await authAPI.signup(email, password);
        const loginData = await authAPI.login(email, password);
        onLogin(loginData);
      } else {
        const loginData = await authAPI.login(email, password);
        onLogin(loginData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-8">
          {isRegistering ? 'Crear cuenta' : 'Orquestador de IAs'}
        </h1>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-700 rounded-lg px-4 py-2 text-white"
              required
            />
            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-700 rounded-lg px-4 py-2 text-white"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg"
            >
              {loading ? '...' : (isRegistering ? 'Registrarse' : 'Iniciar sesión')}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-400 text-sm"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;