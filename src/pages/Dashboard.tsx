import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Edit2, ShieldAlert, Map as MapIcon, List, Box, BarChart3 } from 'lucide-react';
import ForceGraph3D from 'react-force-graph-3d';
import { useAuth } from '../context/AuthContext';
import type { AssignmentData } from '../lib/analytics';
import { buildGraphData, aggregateByProject, aggregateByUser, attachNodeThreeObject, BNB_COLORS, NODE_COLORS } from '../lib/analytics';
import DashboardFilters, { type FilterState, emptyFilters } from '../components/DashboardFilters';
import Charts2D from '../components/Charts2D';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  // Tabs & Toggles
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

  const fg3DRef = useRef<any>(null);

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

      const formattedData: AssignmentData[] = (assignments || []).map((item: any) => ({
        id: item.id,
        scope_hours: Number(item.scope_hours),
        projects: Array.isArray(item.projects) ? item.projects[0] : item.projects,
        users: Array.isArray(item.users) ? item.users[0] : item.users,
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
    const projSearch = filters.project.trim().toLowerCase();
    const userSearch = filters.user.trim().toLowerCase();
    const minH = filters.minHours ? Number(filters.minHours) : -Infinity;
    const maxH = filters.maxHours ? Number(filters.maxHours) : Infinity;

    return data.filter(item => {
      if (projSearch && !item.projects?.name.toLowerCase().includes(projSearch)) return false;
      if (userSearch) {
        const fullName = `${item.users?.first_name} ${item.users?.last_name}`.toLowerCase();
        if (!fullName.includes(userSearch)) return false;
      }
      if (item.scope_hours < minH || item.scope_hours > maxH) return false;
      return true;
    });
  }, [data, filters]);

  const graphData = useMemo(() => buildGraphData(filteredData), [filteredData]);
  const byProject = useMemo(() => aggregateByProject(filteredData), [filteredData]);
  const byUser = useMemo(() => aggregateByUser(filteredData), [filteredData]);

  if (loading && data.length === 0) {
    return <div className="flex-center" style={{ height: 'calc(100vh - 150px)', color: 'var(--text-muted)' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>

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

      {/* SHARED FILTERS (all views) */}
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filteredData.length}
        totalCount={data.length}
      />

      {/* TAB CONTENT: MAP */}
      {activeTab === 'map' && (
        <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 520 }}>

          {/* Controls Overlay */}
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(11,10,20,0.7)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(134,59,255,0.25)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'var(--font-primary)' }}>Mapa Mental de Scope</h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '15px' }}>
              <button
                onClick={() => setViewMode('2D')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${BNB_COLORS.violet}`, background: viewMode === '2D' ? BNB_COLORS.violet : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <BarChart3 size={14} /> Barras
              </button>
              <button
                onClick={() => setViewMode('3D')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${BNB_COLORS.violet}`, background: viewMode === '3D' ? BNB_COLORS.violet : 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Box size={14} /> 3D
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <span style={{ color: NODE_COLORS.project, fontWeight: 'bold' }}>● Violeta</span>: Proyectos<br />
              <span style={{ color: NODE_COLORS.user, fontWeight: 'bold' }}>● Azul</span>: Personas
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
              {viewMode === '3D'
                ? 'Arrastra con clic izquierdo para rotar. Clic derecho para moverte (pan). Rueda para zoom. El tamaño del nodo = total de horas.'
                : 'Diagramas de barras con el total de horas agregado por proyecto y por persona.'}
            </p>
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            {graphData.nodes.length > 0 ? (
              viewMode === '3D' ? (
                <ForceGraph3D
                  ref={fg3DRef}
                  graphData={graphData as any}
                  nodeColor={node => NODE_COLORS[node.group] ?? BNB_COLORS.violet}
                  nodeVal={node => Math.max(Math.sqrt(node.hours) * 1.2, 2)}
                  nodeRelSize={1}
                  nodeOpacity={1}
                  linkColor={() => BNB_COLORS.violetSoft}
                  linkOpacity={0.45}
                  linkWidth={link => Math.max(Math.sqrt(link.value) * 0.6, 0.5)}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleWidth={0.8}
                  linkDirectionalParticleColor={() => BNB_COLORS.blue}
                  linkDirectionalParticleSpeed={0.006}
                  backgroundColor="rgba(0,0,0,0)"
                  showNavInfo={false}
                  enableNodeDrag={false}
                  nodeThreeObject={attachNodeThreeObject}
                  nodeThreeObjectExtend={true}
                  linkThreeObjectExtend={true}
                />
              ) : (
                <div style={{ padding: '90px 20px 20px 20px', height: '100%', overflowY: 'auto' }}>
                  <Charts2D byProject={byProject} byUser={byUser} />
                </div>
              )
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
                No hay datos que coincidan con los filtros actuales.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LIST */}
      {activeTab === 'list' && (
        <div className="glass-panel fade-in" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Detalle de Asignaciones</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredData.length} asignaciones
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
            {filteredData.length === 0 ? (
              <div className="flex-center" style={{ height: '200px', color: 'var(--text-muted)' }}>
                No hay asignaciones que coincidan con los filtros.
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
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(134,59,255,0.15)', color: 'var(--bnb-lavender)', padding: '5px 10px', borderRadius: '8px' }}>
                          {item.scope_hours}h
                        </span>
                      </div>

                      <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bnb-violet), var(--bnb-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
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
