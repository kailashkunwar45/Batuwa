import React, { useState } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="merchant-app">
      <aside className="sidebar">
        <div className="business-info">
          <div className="business-name">Bhat-Bhateni</div>
          <div className="business-id">Merchant ID: BB-9942</div>
        </div>
        <nav>
          <a href="#" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            📈 Sales Overview
          </a>
          <a href="#" className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            🧾 Transactions
          </a>
          <a href="#" className={`nav-item ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
            📷 My QR Code
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settlement' ? 'active' : ''}`} onClick={() => setActiveTab('settlement')}>
            💰 Settlements
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Monitoring your business growth in real-time.</p>
          </div>
          <button className="btn btn-accent">Request Settlement</button>
        </header>

        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'qr' && <QrView />}
      </main>
    </div>
  )
}

function OverviewView() {
  return (
    <>
      <div className="revenue-grid">
        <div className="card revenue-card">
          <div className="revenue-label">Today's Revenue</div>
          <div className="revenue-value">Rs. 42,500</div>
          <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>↑ 14% vs yesterday</div>
        </div>
        <div className="card revenue-card">
          <div className="revenue-label">Weekly Sales</div>
          <div className="revenue-value">Rs. 284,000</div>
          <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>↑ 5% vs last week</div>
        </div>
        <div className="card revenue-card">
          <div className="revenue-label">Active Customers</div>
          <div className="revenue-value">1,242</div>
          <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Returning: 68%</div>
        </div>
      </div>

      <div className="card">
        <h3>Sales Performance</h3>
        <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '2rem 0' }}>
          {[30, 50, 40, 70, 90, 85, 100, 75, 60, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: 'var(--primary)', borderRadius: '6px 6px 0 0', opacity: 0.8 }}></div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span><span>8 PM</span>
        </div>
      </div>
    </>
  )
}

function TransactionsView() {
  const txns = [
    { id: 'TXN-9421', user: 'Kailash K.', amount: 2500, time: '14:25', status: 'SUCCESS' },
    { id: 'TXN-9420', user: 'Arun S.', amount: 1200, time: '14:10', status: 'SUCCESS' },
    { id: 'TXN-9419', user: 'Maya T.', amount: 500, time: '13:55', status: 'SUCCESS' },
  ]

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Txn ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((txn, i) => (
            <tr key={i}>
              <td>{txn.id}</td>
              <td>{txn.user}</td>
              <td style={{ fontWeight: 'bold' }}>Rs. {txn.amount}</td>
              <td>{txn.time}</td>
              <td><span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{txn.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QrView() {
  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div className="card qr-section" style={{ flex: 1 }}>
        <div className="qr-placeholder">
          BATUWA QR
        </div>
        <h3>Bhat-Bhateni Store QR</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Display this QR at your counter for customers to scan and pay.</p>
        <button className="btn btn-primary">Download High-Res PDF</button>
      </div>
      <div className="card" style={{ flex: 1 }}>
        <h3>QR Analytics</h3>
        <div style={{ marginTop: '1.5rem' }}>
          <p>Scans Today: <strong>142</strong></p>
          <p>Conversion Rate: <strong>89%</strong></p>
          <p>Top Counter: <strong>Main Entry A</strong></p>
        </div>
      </div>
    </div>
  )
}

export default App
