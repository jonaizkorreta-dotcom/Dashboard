import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock } from 'lucide-react';

export default function AddHours() {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [hours, setHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // In a real app we'd fetch existing projects for autocomplete
  // Here we'll just allow free text and create if it doesn't exist

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !hours || isNaN(Number(hours))) return;
    
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const projName = projectName.trim();
      let projectId = null;

      // 1. Try to find the project
      let { data: projects, error: findError } = await supabase
        .from('projects')
        .select('id')
        .ilike('name', projName);

      if (findError) throw findError;

      if (projects && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        // 2. Create if doesn't exist
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert([{ name: projName }])
          .select()
          .single();
          
        if (createError) throw createError;
        projectId = newProject.id;
      }

      // 3. Upsert assignment
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
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving data:", error);
      // Fallback for mocked mode
      alert('Error al guardar. Si estás en modo mock, verifica la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card fade-in" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)' }}>
            <Clock size={28} color="var(--secondary)" />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Añadir Horas de Scope</h2>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Registra tus estimaciones para los proyectos</p>
          </div>
        </div>

        {success && (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={20} />
            ¡Asignación guardada con éxito!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="project">Nombre del Proyecto</label>
            <input
              id="project"
              type="text"
              className="input-field"
              placeholder="Ej. Rediseño Web Corporativa"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="hours">Horas de Scope (tu parte)</label>
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

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Horas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
