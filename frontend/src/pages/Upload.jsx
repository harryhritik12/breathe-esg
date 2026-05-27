import { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [sourceType, setSourceType] = useState('sap');
  const [file, setFile] = useState(null);
  const [clientId, setClientId] = useState('1');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSourceChange = (s) => {
    setSourceType(s);
    setFile(null);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', clientId);

    try {
      const res = await axios.post(
        `https://breathe-esg-ekvc.onrender.com/api/ingest/upload/${sourceType}/`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Upload Emissions Data</h1>

      <div style={styles.card}>
        <label style={styles.label}>Data Source</label>
        <div style={styles.sourceRow}>
          {['sap', 'utility', 'travel'].map(s => (
            <button
              key={s}
              onClick={() => handleSourceChange(s)}
              style={{ ...styles.sourceBtn, background: sourceType === s ? '#1a1a2e' : '#eee', color: sourceType === s ? 'white' : '#333' }}
            >
              {s === 'sap' ? 'SAP Fuel & Procurement' : s === 'utility' ? 'Utility Electricity' : 'Corporate Travel'}
            </button>
          ))}
        </div>

        <label style={styles.label}>Client ID</label>
        <input
          style={styles.input}
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          placeholder="Enter client ID"
        />

        <label style={styles.label}>Upload CSV File</label>
        <input
          key={sourceType}
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          style={styles.fileInput}
        />

        <p style={styles.hint}>{getHint(sourceType)}</p>

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.success}>
            <p>✅ Upload successful!</p>
            <p>Rows ingested: <strong>{result.rows}</strong></p>
            <p>Errors: <strong style={{ color: result.errors > 0 ? '#e74c3c' : 'inherit' }}>{result.errors}</strong></p>
          </div>
        )}

        <button onClick={handleUpload} style={styles.button} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div style={styles.sampleCard}>
        <h3>Expected CSV Format</h3>
        <pre style={styles.pre}>{getSampleCSV(sourceType)}</pre>
      </div>
    </div>
  );
}

function getHint(source) {
  const hints = {
    sap: 'SAP flat file export — fuel and procurement data (Scope 1)',
    utility: 'Utility portal CSV export — electricity consumption (Scope 2)',
    travel: 'Concur/Navan CSV export — flights, hotels, ground transport (Scope 3)',
  };
  return hints[source];
}

function getSampleCSV(source) {
  const samples = {
    sap: `posting_date,material_type,quantity,unit,plant_code,vendor
2024-01-15,diesel,500,L,PLANT_IN01,vendor_001
2024-01-20,natural_gas,1200,m3,PLANT_IN02,vendor_002`,
    utility: `billing_start,billing_end,meter_id,consumption_kwh,tariff,site
2024-01-01,2024-01-31,MTR_001,45000,commercial,Mumbai_HQ
2024-02-01,2024-02-29,MTR_001,42000,commercial,Mumbai_HQ`,
    travel: `travel_date,traveler_id,travel_type,origin,destination,distance_km,class
2024-01-10,EMP_001,flight,BOM,DEL,1400,economy
2024-01-15,EMP_002,hotel,,,0,
2024-01-20,EMP_003,ground_transport,,,85,`,
  };
  return samples[source];
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', background: '#f0f4f8', minHeight: '100vh' },
  title: { color: '#1a1a2e', marginBottom: '24px' },
  card: { background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' },
  sourceRow: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  sourceBtn: { padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', boxSizing: 'border-box' },
  fileInput: { display: 'block', marginBottom: '8px' },
  hint: { color: '#666', fontSize: '13px', marginBottom: '16px' },
  button: { background: '#2ecc71', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '12px' },
  error: { color: '#e74c3c', marginBottom: '12px' },
  success: { background: '#eafaf1', border: '1px solid #2ecc71', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
  sampleCard: { background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  pre: { background: '#f8f9fa', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto' },
};