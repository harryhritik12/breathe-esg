import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function Review() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(() => {
    setLoading(true);
    axios.get(`https://breathe-esg-ekvc.onrender.com/api/analyst/rows/?status=${filter}`, { withCredentials: true })
      .then(res => {
        setRows(res.data);
        setLoading(false);
      });
  }, [filter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const action = async (id, type) => {
    await axios.post(`https://breathe-esg-ekvc.onrender.com/api/analyst/rows/${id}/${type}/`, {}, { withCredentials: true });
    fetchRows();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Review Emission Rows</h1>

      <div style={styles.filterRow}>
        {['pending', 'approved', 'rejected', 'suspicious'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ ...styles.filterBtn, background: filter === s ? '#1a1a2e' : '#eee', color: filter === s ? 'white' : '#333' }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Scope</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Period</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} style={styles.trow}>
                <td style={styles.td}><ScopeBadge scope={row.scope} /></td>
                <td style={styles.td}>{row.category}</td>
                <td style={styles.td}>{row.quantity}</td>
                <td style={styles.td}>{row.unit}</td>
                <td style={styles.td}>{row.period_start} → {row.period_end}</td>
                <td style={styles.td}>{row.status}</td>
                <td style={styles.td}>
                  {row.status === 'pending' && (
                    <>
                      <button onClick={() => action(row.id, 'approve')} style={styles.approveBtn}>Approve</button>
                      <button onClick={() => action(row.id, 'reject')} style={styles.rejectBtn}>Reject</button>
                      <button onClick={() => action(row.id, 'flag')} style={styles.flagBtn}>Flag</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No rows found</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ScopeBadge({ scope }) {
  const colors = { scope1: '#e67e22', scope2: '#3498db', scope3: '#2ecc71' };
  return (
    <span style={{ background: colors[scope] || '#999', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
      {scope}
    </span>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', background: '#f0f4f8', minHeight: '100vh' },
  loading: { padding: '32px', color: '#666', fontSize: '18px' },
  title: { color: '#1a1a2e', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  filterBtn: { padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  thead: { background: '#1a1a2e', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  trow: { borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px' },
  approveBtn: { background: '#2ecc71', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' },
  rejectBtn: { background: '#e74c3c', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' },
  flagBtn: { background: '#9b59b6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' },
};