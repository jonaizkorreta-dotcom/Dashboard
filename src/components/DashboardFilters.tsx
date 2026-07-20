import { Filter, X } from 'lucide-react';

export interface FilterState {
  project: string;
  user: string;
  minHours: string;
  maxHours: string;
}

export const emptyFilters: FilterState = {
  project: '',
  user: '',
  minHours: '',
  maxHours: '',
};

interface DashboardFiltersProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  totalCount: number;
}

export default function DashboardFilters({ filters, onChange, resultCount, totalCount }: DashboardFiltersProps) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const hasFilters = filters.project || filters.user || filters.minHours || filters.maxHours;

  return (
    <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Filter size={16} color="var(--primary)" />
        <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
          Filtrar información
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {resultCount} de {totalCount} asignaciones
        </span>
        {hasFilters && (
          <button
            onClick={() => onChange(emptyFilters)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            title="Limpiar filtros"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="input-group" style={{ margin: 0 }}>
          <label>Proyecto</label>
          <input
            type="text"
            className="input-field"
            placeholder="Nombre del proyecto"
            value={filters.project}
            onChange={e => update({ project: e.target.value })}
          />
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label>Persona</label>
          <input
            type="text"
            className="input-field"
            placeholder="Nombre de la persona"
            value={filters.user}
            onChange={e => update({ user: e.target.value })}
          />
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label>Horas mín.</label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            min="0"
            value={filters.minHours}
            onChange={e => update({ minHours: e.target.value })}
          />
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label>Horas máx.</label>
          <input
            type="number"
            className="input-field"
            placeholder="∞"
            min="0"
            value={filters.maxHours}
            onChange={e => update({ maxHours: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
