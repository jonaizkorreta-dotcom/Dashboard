import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, X } from 'lucide-react';

interface AddHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddHoursModal({ isOpen, onClose }: AddHoursModalProps) {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [hours, setHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !hours || isNaN(Number(hours))) return;
    
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const projName = projectName.trim();
      let projectId = null;

      let { data: projects, error: findError } = await supabase
        .from('projects')
        .select('id')
        .ilike('name', projName);

      if (findError) throw findError;

      if (projects && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert([{ name: projName }])
          .select()
          .single();
          
        if (createError) throw createError;
        projectId = newProject.id;
      }

      const { error: assignError } = await supabase
        .from('assignments')
        .upsert(
          { 
            user_id: user?.id, 
            project_id: projectId, 
            scope_hours: Number(hours),
            updated_at: new Date().toISOString()
          }, 
          { onConflict: 'user_id, project_id' }
        );

      if (assignError) throw assignError;

      setSuccess(true);
      setProjectName('');
      setHours('');
      
      // Notify other components (like Dashboard) to refresh data
      window.dispatchEvent(new CustomEvent('scope-updated'));

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error saving data:", error);
      alert('Error al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '30px',
      width: '350px',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)' }}>
            <Clock size={20} color="var(--secondary)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Añadir Scope</h3>
        </div>

        {success && (
          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} />
            ¡Guardado!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="project">Proyecto</label>
            <input
              id="project"
              type="text"
              className="input-field"
              placeholder="Ej. Rediseño Web"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="hours">Horas</label>
            <input
              id="hours"
              type="number"
              min="1"
              step="0.5"
              className="input-field"
              placeholder="Ej. 40"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
