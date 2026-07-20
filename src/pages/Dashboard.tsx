import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Filter, Trash2, Edit2, ShieldAlert, Map as MapIcon, List, Box, Circle } from 'lucide-react';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D from 'react-force-graph-2d';
import { useAuth } from '../context/AuthContext';

interface AssignmentData {
  id: string;
  scope_hours: number;
  projects: { id: string; name: string };
  users: { id: string; first_name: string; last_name: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  
  // Tabs & Toggles
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  
  const fg3DRef = useRef<any>(null);
  const fg2DRef = useRef<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          id,
          scope_hours,
          projects (id, name),
          users (id, first_name, last_name)
        `);

      if (error) throw error;
      
      const formattedData = (assignments || []).map((item: any) => ({
        id: item.id,
        scope_hours: Number(item.scope_hours),
        projects: Array.isArray(item.projects) ? item.projects[0] : item.projects,
        users: Array.isArray(item.users) ? item.users[0] : item.users
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('scope-updated', handleUpdate);
    return () => window.removeEventListener('scope-updated', handleUpdate);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar esta asignación?")) return;
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("Error al borrar");
      console.error(error);
    }
  };

  const handleEdit = async (id: string, currentHours: number) => {
    const newHours = prompt("Introduce el nuevo número de horas de scope:", currentHours.toString());
    if (!newHours || isNaN(Number(newHours))) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ scope_hours: Number(newHours) })
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("Error al actualizar");
      console.error(error);
    }
  };

  const filteredData = useMemo(() => {
    if (!filterProject.trim()) return data;
    const search = filterProject.toLowerCase();
    return data.filter(item => item.projects?.name.toLowerCase().includes(search));
  }, [data, filterProject]);

  const graphData = useMemo(() => {
    const nodesMap = new Map<string, any>();
    const links: any[] = [];

    data.forEach(item => {
      const pId = `proj_${item.projects.id}`;
      const uId = `user_${item.users.id}`;

      if (!nodesMap.has(pId)) {
        nodesMap.set(pId, { id: pId, name: item.projects.name, group: 'project', val: 0 });
      }
      nodesMap.get(pId).val += item.scope_hours;

      if (!nodesMap.has(uId)) {
        nodesMap.set(uId, { id: uId, name: `${item.users.first_name} ${item.users.last_name}`, group: 'user', val: 0 });
      }
      nodesMap.get(uId).val += item.scope_hours;

      links.push({ source: uId, target: pId, value: item.scope_hours });
    });

    return { nodes: Array.from(nodesMap.values()), links };
  }, [data]);

  if (loading && data.length === 0) {
    return <div className="flex-center" style={{ height: 'calc(100vh - 150px)', color: 'var(--text-muted)' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('map')}
          className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapIcon size={18} /> Mapa Visual
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <List size={18} /> Detalle de Asignaciones
        </button>
      </div>

      {/* TAB CONTENT: MAP */}
      {activeTab === 'map' && (
        <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Controls Overlay */}
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Mapa Mental de Scope</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '15px' }}>
              <button 
                onClick={() => setViewMode('2D')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--primary)', background: viewMode === '2D' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Circle size={14} /> 2D
              </button>
              <button 
                onClick={() => setViewMode('3D')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--primary)', background: viewMode === '3D' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Box size={14} /> 3D
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>
              <span style={{ color: '#ec4899', fontWeight: 'bold' }}>● Rosa</span>: Proyectos<br/>
              <span style={{ color: '#6366f1', fontWeight: 'bold' }}>● Azul</span>: Personas
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#999', maxWidth: '200px' }}>
              {viewMode === '3D' ? 'Arrastra con clic izquierdo para rotar. Clic derecho para moverte (pan). Rueda para zoom.' : 'Arrastra para moverte. Rueda para zoom.'}
            </p>
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            {graphData.nodes.length > 0 ? (
              viewMode === '3D' ? (
                <ForceGraph3D
                  ref={fg3DRef}
                  graphData={graphData as any}
                  nodeLabel="name"
                  nodeColor={node => node.group === 'project' ? '#ec4899' : '#6366f1'}
                  nodeVal={node => Math.max(Math.sqrt(node.val) * 2, 5)}
                  linkOpacity={0.3}
                  linkWidth={link => Math.sqrt(link.value) * 0.5}
                  backgroundColor="rgba(0,0,0,0)"
                  enableNodeDrag={false}
                  showNavInfo={false}
                />
              ) : (
                <ForceGraph2D
                  ref={fg2DRef}
                  graphData={graphData as any}
                  nodeLabel="name"
                  nodeColor={node => node.group === 'project' ? '#ec4899' : '#6366f1'}
                  nodeVal={node => Math.max(Math.sqrt(node.val as number) * 2, 5)}
                  linkWidth={link => Math.sqrt(link.value as number) * 0.5}
                  backgroundColor="rgba(0,0,0,0)"
                />
              )
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>Cargando mapa...</div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LIST */}
      {activeTab === 'list' && (
        <div className="glass-panel fade-in" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Detalle de Asignaciones</h3>
            
            <div className="input-group" style={{ margin: 0, width: '300px' }}>
              <div style={{ position: 'relative' }}>
                <Filter size={18} color="var(--primary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Filtrar por proyecto..."
                  style={{ paddingLeft: '2.5rem' }}
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
            {filteredData.length === 0 ? (
              <div className="flex-center" style={{ height: '200px', color: 'var(--text-muted)' }}>
                No hay asignaciones que coincidan con tu búsqueda.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filteredData.map(item => {
                  const isOwner = user?.id === item.users.id;
                  const isAdmin = user?.is_admin;
                  const canEdit = isOwner || isAdmin;

                  return (
                    <div key={item.id} className="glass-card" style={{ padding: '1.5rem' }}>
                      <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{item.projects?.name}</strong>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                          {item.scope_hours}h
                        </span>
                      </div>
                      
                      <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {item.users?.first_name[0]}{item.users?.last_name[0]}
                          </div>
                          <span className="text-muted">
                            {item.users?.first_name} {item.users?.last_name}
                          </span>
                        </div>

                        {canEdit && (
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {isAdmin && !isOwner && <span title="Acción de Administrador" style={{ display: 'flex', alignItems: 'center', marginRight: '5px' }}><ShieldAlert size={16} color="var(--secondary)" /></span>}
                            <button onClick={() => handleEdit(item.id, item.scope_hours)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '8px', borderRadius: '6px', transition: '0.2s' }} title="Editar Horas">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '8px', borderRadius: '6px', transition: '0.2s' }} title="Borrar Asignación">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
