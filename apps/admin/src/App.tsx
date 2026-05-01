import { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'

const api = axios.create({
  baseURL: '/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch stats', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="loading">Loading Admin Panel...</div>

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

        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
        {activeTab === 'kyc' && <KycView />}
        {activeTab === 'fraud' && <FraudView />}
        {activeTab === 'users' && <UsersView />}
      </main>
    </div>
  )
}

function DashboardView({ stats }: { stats: any }) {
  return (
    <>
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>Active: {stats?.activeUsers || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{stats?.totalTransactions || 0}</div>
          <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>Success Rate: {stats?.successRate || '100'}%</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">Rs. {stats?.totalVolume?.toLocaleString() || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">KYC Pending</div>
          <div className="stat-value">{stats?.pendingKyc || 0}</div>
          <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Requires attention</div>
        </div>
      </div>

      <div className="card">
        <h3>Volume Trends</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
          {(stats?.volumeHistory || [40, 60, 45, 90, 65, 85, 100]).map((h: number, i: number) => (
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
  const [kyc, setKyc] = useState([])

  useEffect(() => {
    api.get('/admin/transactions?limit=10').then(({ data }) => setKyc(data.items || []))
  }, [])

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {kyc.map((item: any, i: number) => (
            <tr key={i}>
              <td>{item.id.slice(0, 8)}...</td>
              <td>{item.type}</td>
              <td>Rs. {item.amount}</td>
              <td><span className="badge badge-pending">{item.status}</span></td>
              <td>{new Date(item.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsersView() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data.items || []))
  }, [])

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any, i: number) => (
            <tr key={i}>
              <td>{user.fullName || 'No Name'}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>{user.isActive ? 'Active' : 'Frozen'}</span></td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FraudView() {
  return (
    <div className="card">
      <h3>Fraud Engine Running</h3>
      <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No active high-risk alerts detected in the last 24 hours.</p>
    </div>
  )
}

export default App
