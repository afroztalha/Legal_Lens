import { Handle, Position } from '@xyflow/react';
import { useTheme } from '../ThemeContext';

export function CenterNode({ data }: { data: any }) {
  const { colors, theme } = useTheme();
  return (
    <div style={{
      background: colors.bgCard,
      border: `2px solid ${colors.accent}`,
      borderRadius: '50%',
      width: 130,
      height: 130,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 10,
      boxShadow: theme === 'dark' ? '0 0 25px rgba(99, 102, 241, 0.4)' : '0 10px 30px rgba(99, 102, 241, 0.2)',
      color: colors.textHeading,
      fontWeight: 'bold',
      fontSize: 15,
      fontFamily: 'monospace'
    }}>
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
    </div>
  );
}

export function ClauseNode({ data }: { data: any }) {
  const { colors, theme } = useTheme();
  const bg = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const border = data.color || colors.border;
  
  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: 12,
      padding: '12px 18px',
      minWidth: 160,
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      transform: data.expanded ? 'scale(1.05)' : 'scale(1)'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#888', width: 6, height: 6 }} />
      <div style={{ fontSize: 14, fontWeight: 'bold', color: colors.textHeading, fontFamily: 'monospace' }}>{data.label}</div>
      <div style={{ fontSize: 11, color: border, marginTop: 6, letterSpacing: 1.5, background: `${border}1a`, padding: '4px 8px', borderRadius: 999, display: 'inline-block' }}>{data.riskLevel}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#888', width: 6, height: 6 }} />
    </div>
  );
}

export function DetailNode({ data }: { data: any }) {
  const { colors, theme } = useTheme();
  const bg = theme === 'dark' ? '#0f172a' : '#ffffff';
  
  return (
    <div style={{
      background: bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: '14px',
      maxWidth: 260,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#888', width: 6, height: 6 }} />
      <div style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'monospace' }}>{data.type}</div>
      <div style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 1.6, fontStyle: data.type === 'Law' ? 'monospace' : 'normal' }}>{data.label}</div>
    </div>
  );
}
