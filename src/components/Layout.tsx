import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Plus } from 'lucide-react';
import AddHoursModal from './AddHoursModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
      <nav className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={24} />
            ScopeTracker
          </h2>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {user.first_name} {user.last_name}
            </span>
          </div>
          
          <button 
            onClick={logout}
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </nav>

      <main className="fade-in">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(!isModalOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={30} style={{ transform: isModalOpen ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
      </button>

      <AddHoursModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
