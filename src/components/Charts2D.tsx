import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { BarDatum } from '../lib/analytics';
import { BNB_COLORS } from '../lib/analytics';

interface Charts2DProps {
  byProject: BarDatum[];
  byUser: BarDatum[];
}

const tooltipStyle = {
  backgroundColor: 'rgba(11, 10, 20, 0.95)',
  border: '1px solid rgba(134, 59, 255, 0.4)',
  borderRadius: '8px',
  color: '#f8fafc',
  fontFamily: "'Open Sans', sans-serif",
  fontSize: '0.85rem',
};

const labelStyle = {
  color: '#a39fbf',
  fontFamily: "'Open Sans', sans-serif",
  fontSize: '0.8rem',
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: 380 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <div style={{ flex: 1, minHeight: 280 }}>{children}</div>
    </div>
  );
}

export default function Charts2D({ byProject, byUser }: Charts2DProps) {
  const projectData = useMemo(() => byProject.slice(0, 10).map(d => ({ ...d, fill: BNB_COLORS.violet })), [byProject]);
  const userData = useMemo(() => byUser.slice(0, 10).map(d => ({ ...d, fill: BNB_COLORS.blue })), [byUser]);

  if (projectData.length === 0 && userData.length === 0) {
    return (
      <div className="flex-center" style={{ height: 300, color: 'var(--text-muted)' }}>
        No hay datos para mostrar con los filtros actuales.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
      <ChartCard
        title="Horas por proyecto"
        subtitle="Total de horas de scope asignadas a cada proyecto (top 10)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,230,255,0.08)" />
            <XAxis type="number" stroke="#a39fbf" tick={{ fontSize: 11, fill: '#a39fbf' }} />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#a39fbf"
              tick={{ fontSize: 11, fill: '#a39fbf' }}
              width={120}
            />
            <Tooltip cursor={{ fill: 'rgba(134,59,255,0.1)' }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
            <Bar dataKey="hours" name="Horas" radius={[0, 6, 6, 0]}>
              {projectData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Horas por persona"
        subtitle="Total de horas de scope asignadas a cada persona (top 10)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={userData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,230,255,0.08)" />
            <XAxis type="number" stroke="#a39fbf" tick={{ fontSize: 11, fill: '#a39fbf' }} />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#a39fbf"
              tick={{ fontSize: 11, fill: '#a39fbf' }}
              width={120}
            />
            <Tooltip cursor={{ fill: 'rgba(71,191,255,0.1)' }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
            <Bar dataKey="hours" name="Horas" radius={[0, 6, 6, 0]}>
              {userData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
