import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/analyst/stats/', { withCredentials: true }),
      axios.get('http://127.0.0.1:8000/api/analyst/batches/', { withCredentials: true })
    ]).then(([statsRes, batchesRes]) => {
      setStats(statsRes.data);
      setBatches(batchesRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Breathe ESG — Analyst Dashboard</h1>

      {stats && (
        <div style={styles.statsRow}>
          <StatCard label="Total Rows" value={stats.total} color="#3498db" />
          <StatCard label="Pending" value={stats.pending} color="#f39c12" />
          <StatCard label="Approved" value={stats.approved} color="#2ecc71" />
          <StatCard label="Rejected" value={stats.rejected} color="#e74c3c" />
          <StatCard label="Suspicious" value={stats.suspicious} color="#9b59b6" />
        </div>
      )}

      <h2 style={styles.sectionTitle}>Recent Uploads</h2>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Source</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Rows</th>
            <th style={styles.th}>Errors</th>
            <th style={styles.th}>Uploaded At</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(b => (
            <tr key={b.id} style={styles.trow}>
              <td style={styles.td}>{b.client}</td>
              <td style={styles.td}><Badge source={b.source_type} /></td>
              <td style={styles.td}>{b.status}</td>
              <td style={styles.td}>{b.row_count}</td>
              <td style={{ ...styles.td, color: b.error_count > 0 ? '#e74c3c' : 'inherit' }}>{b.error_count}</td>
              <td style={styles.td}>{new Date(b.uploaded_at).toLocaleString()}</td>
            </tr>
          ))}
          {batches.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No uploads yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
  );
}

function Badge({ source }) {
  const colors = { sap: '#e67e22', utility: '#3498db', travel: '#2ecc71' };
  return (
    <span style={{ background: colors[source] || '#999', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
      {source}
    </span>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', background: '#f0f4f8', minHeight: '100vh' },
  loading: { padding: '32px', fontFamily: 'sans-serif', color: '#666', fontSize: '18px' },
  title: { color: '#1a1a2e', marginBottom: '24px' },
  statsRow: { display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', minWidth: '140px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardLabel: { margin: 0, color: '#666', fontSize: '13px' },
  cardValue: { margin: '8px 0 0', fontSize: '32px', fontWeight: 'bold' },
  sectionTitle: { color: '#1a1a2e', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  thead: { background: '#1a1a2e', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  trow: { borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px' },
};