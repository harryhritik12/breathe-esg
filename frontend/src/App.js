import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import Upload from './pages/Upload';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return (
    <BrowserRouter>
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <h2 style={styles.logo}>🌿 Breathe ESG</h2>
          <nav>
            <Link to="/dashboard" style={styles.navLink}>📊 Dashboard</Link>
            <Link to="/upload" style={styles.navLink}>📤 Upload</Link>
            <Link to="/review" style={styles.navLink}>✅ Review</Link>
          </nav>
        </div>

        {/* Main content */}
        <div style={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/review" element={<Review />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: '220px', background: '#1a1a2e', padding: '24px', display: 'flex', flexDirection: 'column' },
  logo: { color: 'white', marginBottom: '32px', fontSize: '18px' },
  navLink: { display: 'block', color: '#ccc', textDecoration: 'none', padding: '10px 0', fontSize: '15px' },
  main: { flex: 1, overflowY: 'auto' },
};