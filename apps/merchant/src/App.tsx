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
  const [activeTab, setActiveTab] = useState('overview')
  const [merchant, setMerchant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const { data } = await api.get('/merchants/me')
        setMerchant(data)
      } catch (err) {
        console.error('Failed to fetch merchant profile', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMerchant()
  }, [])

  if (loading) return <div className="loading">Loading Merchant Portal...</div>

  return (
    <div className="merchant-app">
      <aside className="sidebar">
        <div className="business-info">
          <div className="business-name">{merchant?.businessName || 'Merchant'}</div>
          <div className="business-id">Status: {merchant?.isVerified ? '✅ Verified' : '⏳ Pending'}</div>
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

        {activeTab === 'overview' && <OverviewView merchant={merchant} />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'qr' && <QrView merchant={merchant} />}
      </main>
    </div>
  )
}

function OverviewView({ merchant }: { merchant: any }) {
  return (
    <>
      <div className="revenue-grid">
        <div className="card revenue-card">
          <div className="revenue-label">Total Volume</div>
          <div className="revenue-value">Rs. {merchant?.totalVolume?.toLocaleString() || 0}</div>
          <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Updated just now</div>
        </div>
        <div className="card revenue-card">
          <div className="revenue-label">Total Transactions</div>
          <div className="revenue-value">{merchant?.totalTxnCount || 0}</div>
        </div>
        <div className="card revenue-card">
          <div className="revenue-label">Settlement Cycle</div>
          <div className="revenue-value">{merchant?.settlementCycle || 'DAILY'}</div>
        </div>
      </div>

      <div className="card">
        <h3>Sales Performance</h3>
        <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '2rem 0' }}>
          {[30, 50, 40, 70, 90, 85, 100, 75, 60, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: 'var(--primary)', borderRadius: '6px 6px 0 0', opacity: 0.8 }}></div>
          ))}
        </div>
      </div>
    </>
  )
}

function TransactionsView() {
  return (
    <div className="card">
      <p style={{ color: 'var(--text-secondary)' }}>Live transaction feed is being synchronized...</p>
    </div>
  )
}

function QrView({ merchant }: { merchant: any }) {
  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div className="card qr-section" style={{ flex: 1 }}>
        <div className="qr-placeholder" style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
          <img 
            src={merchant?.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + merchant?.qrCode} 
            alt="Merchant QR" 
            style={{ width: '100%' }}
          />
        </div>
        <h3>{merchant?.businessName} QR</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Scan to pay directly to this merchant.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Download High-Res PDF</button>
      </div>
    </div>
  )
}

export default App
