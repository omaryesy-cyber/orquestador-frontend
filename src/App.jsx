import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// ============================================
// VARIABLE DE ENTORNO (la clave para conectar con el backend)
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// SERVICIO DE AUTENTICACIÓN
// ============================================
const authService = {
  signup: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al registrarse');
    return data;
  },
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Credenciales inválidas');
    if (!data.token) throw new Error('Respuesta inválida');
    return data;
  }
};

// ============================================
// COMPONENTE DE LOGIN/REGISTRO
// ============================================
const LoginForm = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await authService.signup(email, password);
        const user = await authService.login(email, password);
        onLogin(user);
      } else {
        const user = await authService.login(email, password);
        onLogin(user);
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
          {isSignup ? 'Crear cuenta' : 'Orquestador de IAs'}
        </h1>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
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
              {loading ? '...' : (isSignup ? 'Registrarse' : 'Iniciar sesión')}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-blue-400 text-sm"
            >
              {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL (ORQUESTADOR)
// ============================================
const Orquestador = () => {
  const [user, setUser] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedIA, setSelectedIA] = useState('deepseek-chat');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      setUser({ email, token });
    }
  }, []);

  useEffect(() => {
    if (user) {
      cargarRequisitos();
    }
  }, [user]);

  const cargarRequisitos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/requisitos`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setRequisitos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando requisitos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !user) return;

    try {
      // 1. Crear requisito
      const reqResponse = await fetch(`${API_URL}/requisitos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          prioridad: 'media',
          estado: 'pendiente'
        })
      });
      const requisito = await reqResponse.json();

      // 2. Enviar a IA
      const iaResponse = await fetch(`${API_URL}/ia/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          prompt: `Analiza: ${titulo} - ${descripcion}`,
          ia: selectedIA
        })
      });
      const iaData = await iaResponse.json();

      // 3. Actualizar requisito con respuesta de IA
      await fetch(`${API_URL}/requisitos/${requisito.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...requisito,
          respuesta_ia: iaData.respuesta,
          estado: 'en_curso'
        })
      });

      // 4. Recargar lista y limpiar formulario
      cargarRequisitos();
      setTitulo('');
      setDescripcion('');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: 'white' }}>Orquestador de IAs</h1>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Formulario nuevo requisito */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Nuevo Requisito</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#334155', color: 'white' }}
              required
            />
            <textarea
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="3"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#334155', color: 'white' }}
            />
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', marginRight: '10px' }}>IA:</label>
              <select
                value={selectedIA}
                onChange={(e) => setSelectedIA(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: 'none' }}
              >
                <option value="deepseek-chat">DeepSeek</option>
<option value="qwen-turbo">Qwen Turbo</option>
<option value="kimi-k2">Kimi K2</option>
<option value="groq-llama">Groq Llama 3.3</option>
              </select>
            </div>
            <button
              type="submit"
              style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Crear y enviar a IA
            </button>
          </form>
        </div>

        {/* Lista de requisitos */}
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Mis Requisitos</h3>
        {loading && <p>Cargando...</p>}
        {!loading && requisitos.length === 0 && <p>No hay requisitos.</p>}
        {requisitos.map((req) => (
          <div key={req.id} style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
            <h4>{req.titulo}</h4>
            <p>{req.descripcion}</p>
            {req.respuesta_ia && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                <strong>Respuesta de IA:</strong>
                <p>{req.respuesta_ia}</p>
              </div>
            )}
            <div>Estado: {req.estado} | Prioridad: {req.prioridad}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// RENDERIZADO PRINCIPAL
// ============================================
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Orquestador />
  </React.StrictMode>
);

export default Orquestador;
// rebuild
