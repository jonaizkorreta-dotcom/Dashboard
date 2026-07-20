import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    
    setIsSubmitting(true);
    await login(firstName.trim(), lastName.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '1rem' }}>
            <LogIn size={32} color="var(--primary)" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Bienvenido</h2>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Identifícate para gestionar tus proyectos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="firstName">Nombre</label>
            <input
              id="firstName"
              type="text"
              className="input-field"
              placeholder="Ej. Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="lastName">Apellidos</label>
            <input
              id="lastName"
              type="text"
              className="input-field"
              placeholder="Ej. Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar al Tracker'}
          </button>
        </form>
      </div>
    </div>
  );
}
