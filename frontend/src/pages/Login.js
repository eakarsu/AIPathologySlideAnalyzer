import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('pathologist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const autofill = () => {
    setEmail('admin@pathlab.com');
    setPassword('password123');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.register({ email, password, name, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-icon">{'\u{1F52C}'}</div>
        <h1>PathologyAI</h1>
        <p className="subtitle">AI-Powered Digital Pathology Slide Analyzer</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: '8px 0', background: mode === 'login' ? '#2563eb' : '#1f2937', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: mode === 'login' ? 'bold' : 'normal' }}>Sign In</button>
          <button onClick={() => { setMode('register'); setError(''); }} style={{ flex: 1, padding: '8px 0', background: mode === 'register' ? '#2563eb' : '#1f2937', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: mode === 'register' ? 'bold' : 'normal' }}>Register</button>
        </div>

        {mode === 'login' && (
          <button className="autofill-btn" onClick={autofill}>Click to auto-fill credentials</button>
        )}

        {error && <div style={{ background: '#dc262620', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Jane Smith" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={6} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 14 }}>
                <option value="pathologist">Pathologist</option>
                <option value="lab_tech">Lab Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#71717a' }}>
            <div>Demo Accounts:</div>
            <div style={{ marginTop: 4 }}>admin@pathlab.com | pathologist@pathlab.com</div>
            <div>Password: password123</div>
          </div>
        )}
      </div>
    </div>
  );
}
