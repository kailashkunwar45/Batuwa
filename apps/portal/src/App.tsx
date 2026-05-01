import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import axios from 'axios'
import './index.css'

type AuthStep = 'identity' | 'otp' | 'success' | 'onboarding'

function App() {
  const [step, setStep] = useState<AuthStep>('identity')
  const [target, setTarget] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/v1/auth/send-otp', { target, type: 'LOGIN' })
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/api/v1/auth/verify-otp', {
        target,
        code: otp.join(''),
        type: 'LOGIN'
      })
      
      const { accessToken, user: userData } = response.data
      localStorage.setItem('accessToken', accessToken)
      setUser(userData)
      
      // Role based redirection logic
      if (userData.role === 'ADMIN') {
        window.location.href = '/admin/'
      } else if (userData.role === 'MERCHANT') {
        window.location.href = '/merchant/'
      } else {
        setStep('success')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-container">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass-card"
        >
          <div className="logo-container">
            <img src="/logo.png" alt="Batuwa Logo" className="logo-icon floating" />
            <h1 className="title">Batuwa</h1>
            <p className="subtitle">Nepal's Digital Wallet Portal</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {step === 'identity' && (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="input" 
                    placeholder="Enter your email address"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <p className="subtitle" style={{ marginBottom: '2rem' }}>
                Enter the 6-digit code sent to <br/><strong>{target}</strong>
              </p>
              <div className="otp-grid">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    className="otp-input"
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp]
                      newOtp[idx] = e.target.value
                      setOtp(newOtp)
                      if (e.target.value && idx < 5) {
                        (e.target.nextSibling as HTMLInputElement)?.focus()
                      }
                    }}
                  />
                ))}
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleVerifyOtp}
                disabled={loading || otp.some(d => !d)}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                <ShieldCheck size={20} />
              </button>
              <button 
                className="btn" 
                style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}
                onClick={() => setStep('identity')}
              >
                Change Identity
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="success-animation">
              <CheckCircle2 className="check-icon" />
              <h2 className="title" style={{ fontSize: '2rem' }}>Welcome Back!</h2>
              <p className="subtitle" style={{ marginBottom: '2rem' }}>
                You are successfully logged in as <strong>{user?.fullName || 'User'}</strong>.
              </p>
              <p className="subtitle" style={{ fontSize: '0.875rem' }}>
                Please use the <strong>Batuwa Mobile App</strong> to access your wallet features.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '2rem' }}
                onClick={() => window.location.reload()}
              >
                Back to Portal
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default App
