import React, { useState } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <span>🎒</span> Batuwa Admin
        </div>
        <nav>
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </a>
          <a href="#" className={`nav-item ${activeTab === 'kyc' ? 'active' : ''}`} onClick={() => setActiveTab('kyc')}>
            🛡️ KYC Review
          </a>
          <a href="#" className={`nav-item ${activeTab === 'fraud' ? 'active' : ''}`} onClick={() => setActiveTab('fraud')}>
            ⚠️ Fraud Alerts
          </a>
          <a href="#" className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 Users
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Admin. System is running stable.</p>
        </header>

        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'kyc' && <KycView />}
        {activeTab === 'fraud' && <FraudView />}
      </main>
    </div>
  )
}

function DashboardView() {
  return (
    <>
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">12,482</div>
          <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>↑ 12% from last month</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Daily Volume</div>
          <div className="stat-value">Rs. 4.2M</div>
          <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>↑ 8% from yesterday</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">KYC Pending</div>
          <div className="stat-value">142</div>
          <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Requires attention</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Active Frauds</div>
          <div className="stat-value">3</div>
          <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>High priority</div>
        </div>
      </div>

      <div className="card">
        <h3>System Health</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
          {[40, 60, 45, 90, 65, 85, 100].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </>
  )
}

function KycView() {
  const pendingKyc = [
    { name: 'Kailash Kunwar', type: 'Citizenship', level: 'Level 2', date: '2026-04-23' },
    { name: 'Arun Sharma', type: 'Passport', level: 'Level 2', date: '2026-04-22' },
    { name: 'Sita Devi', type: 'Citizenship', level: 'Level 1', date: '2026-04-22' },
  ]

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Document</th>
            <th>Level</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingKyc.map((kyc, i) => (
            <tr key={i}>
              <td>{kyc.name}</td>
              <td>{kyc.type}</td>
              <td><span className="badge badge-pending">{kyc.level}</span></td>
              <td>{kyc.date}</td>
              <td>
                <button className="btn btn-primary" style={{ marginRight: '0.5rem' }}>Approve</button>
                <button className="btn btn-outline">Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FraudView() {
  const alerts = [
    { user: 'Bishal Rai', reason: 'High Velocity (10 txns / 5 min)', score: 0.92, status: 'BLOCKED' },
    { user: 'Maya Tamang', reason: 'Unusual Hour (3 AM)', score: 0.65, status: 'FLAGGED' },
  ]

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Reason</th>
            <th>Risk Score</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, i) => (
            <tr key={i}>
              <td>{alert.user}</td>
              <td>{alert.reason}</td>
              <td><span style={{ color: alert.score > 0.8 ? 'var(--error)' : 'var(--accent)' }}>{alert.score * 100}%</span></td>
              <td><span className={`badge ${alert.status === 'BLOCKED' ? 'badge-error' : 'badge-pending'}`}>{alert.status}</span></td>
              <td>
                <button className="btn btn-outline">Resolve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
