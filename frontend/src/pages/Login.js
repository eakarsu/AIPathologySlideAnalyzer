import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const autofill = () => {
    setEmail('admin@pathlab.com');
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-icon">{'\u{1F52C}'}</div>
        <h1>PathologyAI</h1>
        <p className="subtitle">AI-Powered Digital Pathology Slide Analyzer</p>
        <button className="autofill-btn" onClick={autofill}>
          Click to auto-fill credentials
        </button>
        {error && <div style={{ background: '#dc262620', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
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
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#71717a' }}>
          <div>Demo Accounts:</div>
          <div style={{ marginTop: 4 }}>admin@pathlab.com | pathologist@pathlab.com</div>
          <div>Password: password123</div>
        </div>
      </div>
    </div>
  );
}
