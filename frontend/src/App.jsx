import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BatteryCharging, Bell,
  Check, ChevronDown, CircleHelp, Clock3, Download, Gauge, LayoutDashboard,
  Leaf, LogOut, MapPin, Menu, Radio, Settings as SettingsIcon, Shield, ShieldAlert,
  ShieldCheck, SlidersHorizontal, Trees, Zap, X, UserCheck, Phone, Mail, Award,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  downloadReport, getAlerts, getDashboard, getLocations, getReadings, getReports,
  getSettings, login, register, logout, saveSettings, resolveAlert,
} from './api'
import FenceMap from './components/FenceMap'

const NAV_ITEMS = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'monitoring', label: 'Data analytics', icon: Activity },
  { path: 'live-monitoring', label: 'Live Monitoring', icon: Gauge },
  { path: 'alerts', label: 'Alerts', icon: Bell, badge: true },
  { path: 'reports', label: 'Reports', icon: Download },
  { path: 'profile', label: 'Officer Profile', icon: UserCheck },
]

const initials = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('fencewatch_user')) } catch { return null }
}

function App() {
  const [user, setUser] = useState(getStoredUser)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const role = 'eb_officer'
  const forest = false
  const base = '/eb'
  const currentPage = location.pathname.split('/')[2] || 'overview'

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const onLogin = (nextUser) => {
    setUser(nextUser)
    navigate('/eb/overview')
  }
  const onLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  if (!user || !localStorage.getItem('fencewatch_token')) {
    return <Routes><Route path="*" element={<LoginPage onLogin={onLogin} />} /></Routes>
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/eb/overview" replace />} />
      <Route path="/forest/*" element={<Navigate to="/eb/overview" replace />} />
      <Route path="/eb/*" element={<DashboardShell user={user} role="eb" page={currentPage} base="/eb" mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/eb/overview" replace />} />
    </Routes>
  )
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState(() => localStorage.getItem('fencewatch_saved_role') || 'eb_officer')
  const [username, setUsername] = useState(() => localStorage.getItem('fencewatch_saved_username') || '')
  const [password, setPassword] = useState(() => localStorage.getItem('fencewatch_saved_password') || '')
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('fencewatch_remember') !== 'false')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Quick switch credentials helper
  function quickFill() {
    setRole('eb_officer')
    setUsername('eb')
    setPassword('eb123')
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    if (rememberMe) {
      localStorage.setItem('fencewatch_saved_username', username)
      localStorage.setItem('fencewatch_saved_password', password)
      localStorage.setItem('fencewatch_saved_role', role)
      localStorage.setItem('fencewatch_remember', 'true')
    } else {
      localStorage.removeItem('fencewatch_saved_username')
      localStorage.removeItem('fencewatch_saved_password')
      localStorage.removeItem('fencewatch_saved_role')
      localStorage.setItem('fencewatch_remember', 'false')
    }

    try {
      const user = await login(username.trim(), password, role)
      onLogin(user)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-photo" />
      <div className="login-shade" />
      <header className="login-top"><Brand /><span className="secure-label"><ShieldCheck size={15} /> SECURE MONITORING PORTAL</span></header>
      <section className="login-content">
        <div className="login-copy">
          <div className="eyebrow"><span className="pulse-dot" /> PROTECTING WHAT MATTERS</div>
          <h1>Where the forest<br />meets the <span>future.</span></h1>
          <p>One connected view of the fence line. Keeping wildlife safe and communities protected, around the clock.</p>
          <div className="login-trust"><div className="trust-avatars"><span>FO</span><span>EB</span><span><Shield size={14} /></span></div><div><strong>One network. Two teams.</strong><small>Field-ready intelligence, in real time.</small></div></div>
        </div>
        <form className="login-card glass-card" onSubmit={submit}>
          <div className="login-card-heading">
            <div className="brand-mark large"><Zap size={21} fill="currentColor" /></div>
            <div>
              <span className="overline">WELCOME BACK</span>
              <h2>Sign in to your account</h2>
            </div>
          </div>

          <label className="field-label" htmlFor="username">Username</label>
          <div className="input-wrap"><span className="input-prefix">@</span><input id="username" autoComplete="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>

          <label className="field-label" htmlFor="password">Password</label>
          <div className="input-wrap"><input id="password" autoComplete="current-password" type={visible ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="show-password" type="button" onClick={() => setVisible((v) => !v)}>{visible ? 'Hide' : 'Show'}</button></div>

          <label className="field-label">Workspace / Role</label>
          <div className="role-selector">
            <button type="button" className="role-option selected" style={{ width: '100%' }} onClick={() => setRole('eb_officer')}>
              <Zap size={17} /><span>EB Officer</span><Check size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 16px', fontSize: '13px', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Remember me & auto-save credentials</span>
            </label>
          </div>

          {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}
          {successMsg && <div className="form-error" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#34d399' }}><Check size={15} />{successMsg}</div>}

          <button className="primary-button login-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <>Sign in securely <ArrowUpRight size={17} /></>}
          </button>

          <div className="login-foot"><span>256-bit encrypted session</span><span>v1.0.0</span></div>
        </form>
      </section>
      <footer className="login-bottom"><span>© 2025 FenceWatch Monitoring System</span><span>Built for safer forests and communities <Leaf size={14} /></span></footer>
    </main>
  )
}

function Brand({ compact = false }) {
  return <div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div>{!compact && <div className="brand-name">fence<span>watch</span><small>MONITORING SYSTEM</small></div>}</div>
}

function DashboardShell({ user, role, page, base, mobileOpen, setMobileOpen, onLogout }) {
  const forest = role === 'forest'
  const title = forest ? 'Forest operations' : 'Electrical operations'
  const theme = forest ? 'forest' : 'electrical'
  return (
    <div className={`app-shell ${theme}`}>
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand"><Brand /><button className="close-sidebar" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switch"><span className="workspace-icon">{forest ? <Trees size={16} /> : <Zap size={16} />}</span><span><strong>{forest ? 'Forest Division' : 'Electrical Division'}</strong><small>{forest ? 'Wildlife protection' : 'Power & infrastructure'}</small></span><ChevronDown size={15} className="switch-chevron" /></div>
        <div className="nav-caption">MONITORING</div>
        <nav className="main-nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => (
            <NavLink key={path} to={`${base}/${path}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{badge && <span className="nav-count">3</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-link" onClick={onLogout}><LogOut size={18} /><span>Sign out</span></button>
          <div className="profile-block"><div className="avatar">{initials(user.full_name || user.username)}</div><div className="profile-copy"><strong>{user.full_name || user.username}</strong><small>{forest ? 'Forest Officer' : 'EB Officer'}</small></div><button className="profile-menu" aria-label="Profile menu"><SlidersHorizontal size={16} /></button></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumb"><span>FenceWatch</span><span className="crumb-slash">/</span><strong>{NAV_ITEMS.find((item) => item.path === page)?.label || 'Overview'}</strong></div><div className="topbar-actions"><span className="topbar-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="avatar small">{initials(user.full_name || user.username)}</div></div></header>
        <div className="page-content"><PageRouter page={page} role={role} title={title} user={user} /></div>
      </main>
    </div>
  )
}

function PageRouter({ page, role, title, user }) {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setError('')
      try {
        let data
        if (page === 'overview') data = await getDashboard()
        else if (page === 'monitoring' || page === 'live-monitoring') data = await getReadings()
        else if (page === 'alerts') data = await getAlerts()
        else if (page === 'locations') data = await getLocations()
        else if (page === 'reports') data = await getReports()
        else if (page === 'settings' || page === 'profile') data = await getSettings()
        if (active) setPayload(data)
      } catch (err) {
        if (active) setError(err.response?.data?.detail || 'Could not load this section. Please try again.')
      }
    }
    load()
    if (page === 'overview' || page === 'monitoring') {
      const interval = setInterval(load, 15000)
      return () => { active = false; clearInterval(interval) }
    }
    return () => { active = false }
  }, [page, refresh])

  if (error) return <ErrorState message={error} retry={() => setRefresh((n) => n + 1)} />
  if (!payload) return <LoadingState />
  if (page === 'overview') return <Overview role={role} title={title} data={payload} />
  if (page === 'monitoring') return <Monitoring role={role} data={payload} />
  if (page === 'live-monitoring') return <LiveMonitoring role={role} data={payload} />
  if (page === 'alerts') return <Alerts role={role} data={payload} />
  if (page === 'reports') return <Reports role={role} data={payload} />
  if (page === 'locations') return <Locations role={role} data={payload} />
  if (page === 'settings' || page === 'profile') return <OfficerProfile role={role} user={user} data={payload} />
  return <EmptyState title="Page not found" detail="Choose a section from the navigation." />
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function DataBadge({ demo }) {
  return <span className="data-badge live"><span className="data-badge-dot" />LIVE HARDWARE</span>
}

function Overview({ role, title, data }) {
  const forest = role === 'forest'
  const stats = data.stats || []
  const metrics = stats.slice(0, 4)
  const readings = data.chart || []
  const alerts = data.alerts || []
  return (
    <>
      <PageHeading eyebrow={`${title} · ${data.site_name || 'Western Range'}`} title={forest ? 'Good morning, Officer.' : 'Good morning, team.'} description={forest ? 'Here’s what’s happening across your protected forest zone today.' : 'A clear view of fence power, sensor health, and field conditions.'} />
      <div className="stat-grid" style={{ marginTop: '16px' }}>{metrics.map((metric, i) => <StatCard key={metric.label} item={metric} index={i} role={role} />)}</div>
      <section className="content-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <div className="panel map-panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-kicker">PRECISION SATELLITE RADAR</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>Google Maps · Real-Time Fence Perimeter & Sensor Nodes</h3>
            </div>
            <div className="map-legend" style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Active Fence</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Intrusion / Wire Cut</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> High Risk</span>
            </div>
          </div>
          <FenceMap />
        </div>
      </section>
    </>
  )
}

function StatCard({ item, index, role }) {
  const icons = role === 'forest' ? [ShieldCheck, Zap, Trees, Activity] : [Zap, Activity, BatteryCharging, Radio]
  const Icon = icons[index % icons.length]
  const positive = item.trend === 'up' || item.trend === 'stable'
  return <div className="stat-card"><div className="stat-top"><div className={`stat-icon icon-${index}`}><Icon size={18} /></div><span className={`trend-pill ${positive ? 'good' : 'warning'}`}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{item.change || 'Stable'}</span></div><div className="stat-value">{item.value}<span>{item.unit}</span></div><div className="stat-label">{item.label}</div><div className="stat-foot"><span className="stat-line"><i style={{ width: `${item.health ?? 82}%` }} /></span><span>{item.footnote || 'vs. previous period'}</span></div></div>
}

function SensorRows({ data, role }) {
  if (!data.length) return <div className="empty-inline">No sensor information available yet.</div>
  return <div className="sensor-list">{data.map((sensor) => <div className="sensor-row" key={sensor.name}><span className={`sensor-icon ${sensor.status === 'warning' ? 'sensor-warn' : ''}`}>{sensor.icon === 'temperature' ? <Gauge size={16} /> : sensor.icon === 'power' ? <Zap size={16} /> : sensor.icon === 'wildlife' ? <Trees size={16} /> : sensor.icon === 'battery' ? <BatteryCharging size={16} /> : <Activity size={16} />}</span><div className="sensor-name"><strong>{sensor.name}</strong><small>{sensor.description}</small></div><div className="sensor-value">{sensor.value}<small>{sensor.unit}</small></div><span className={`sensor-state ${sensor.status === 'warning' ? 'state-warning' : ''}`}><i />{sensor.status_label || 'Normal'}</span></div>)}</div>
}

function AlertRow({ alert, onResolve }) {
  const severity = alert.severity?.toLowerCase() || 'low'
  const isResolved = alert.status === 'resolved'
  const Icon = severity === 'critical' || severity === 'high' ? ShieldAlert : severity === 'medium' ? AlertTriangle : Check

  return (
    <div className={`alert-row ${isResolved ? 'alert-resolved' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className={`alert-icon severity-${severity}`} style={{ opacity: isResolved ? 0.6 : 1 }}>
          <Icon size={16} />
        </span>
        <div className="alert-copy">
          <strong style={{ textDecoration: isResolved ? 'line-through' : 'none', color: isResolved ? '#94a3b8' : '#f1f5f9' }}>
            {alert.title}
          </strong>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {alert.location || 'Fence segment'} · {new Date(alert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {isResolved && (
              <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 600 }}>
                ✔ Solved by: {alert.resolved_by || 'Officer on duty'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className={`severity-label severity-text-${severity}`}>
          {isResolved ? 'RESOLVED' : severity}
        </span>
        {!isResolved && onResolve && (
          <button
            type="button"
            onClick={() => onResolve(alert.id)}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Check size={13} /> Mark as Resolved
          </button>
        )}
      </div>
    </div>
  )
}

function DemoNotice() {
  return null
}

function Monitoring({ role, data }) {
  const rows = data.csv_rows || []

  // 1. Voltage Trend from CSV
  const voltageData = rows.map((r) => ({
    time: r.time,
    voltage: r.voltage,
    benchmark: 110,
  }))

  // 2. Fence Integrity Score (%) from CSV
  const integrityData = rows.map((r) => ({
    time: r.time,
    integrity: r.integrity,
  }))

  // 3. Voltage Safety Index (Safe vs Unsafe margin from CSV)
  const safetyData = rows.map((r) => ({
    time: r.time,
    safetyIndex: r.voltage > 120 ? 45 : 99,
    status: r.safety_status,
  }))

  // 4. Power Consumption (kWh) & Grid Frequency (Hz) from CSV
  const powerConsumptionData = rows.map((r) => ({
    time: r.time,
    kwh: r.power_consumption,
    freq: r.grid_frequency,
  }))

  return (
    <>
      <PageHeading
        eyebrow="INTELLIGENT INSIGHTS (CSV DATASET VISUALIZATION)"
        title="Data Analytics"
        description="Electrical telemetry loaded directly from CSV dataset: Voltage readings, Fence Integrity, Safety Status, and Power Consumption."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '22px', marginTop: '16px' }}>

        {/* Graph 1: Live Voltage Trend Sparkline */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-kicker">VOLTAGE DISCHARGE SPARK</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '16px' }}>1. Fence Voltage (V) vs Benchmark</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', color: '#10b981', fontWeight: 800, fontFamily: 'monospace' }}>114 V Avg</span>
              <div style={{ fontSize: '10px', color: '#10b981' }}>● CSV Telemetry Feed</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={voltageData}>
                <defs>
                  <linearGradient id="voltSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#0f1711', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="natural" dataKey="voltage" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#voltSpark)" name="Voltage (V)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <span>Min: 105 V</span>
            <span>Safety Limit: 120 V</span>
            <span>Surge Peak: 135 V</span>
          </div>
        </div>

        {/* Graph 2: Fence Integrity Score % Sparkline */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-kicker">PERIMETER INTEGRITY SPARK</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '16px' }}>2. 24-Hour Fence Integrity Score (%)</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', color: '#10b981', fontWeight: 800, fontFamily: 'monospace' }}>98.8%</span>
              <div style={{ fontSize: '10px', color: '#10b981' }}>● Optimal Continuity</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={integrityData}>
                <defs>
                  <linearGradient id="integritySpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#0f1711', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="natural" dataKey="integrity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#integritySpark)" name="Integrity %" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <span>Morning: 98.2%</span>
            <span>Threshold: &gt;80% Safe</span>
            <span>Evening: 98.8%</span>
          </div>
        </div>

        {/* Graph 3: Voltage Safety Margin (Safe or No) */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-kicker">ELECTRICAL COMPLIANCE SPARK</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '16px' }}>3. Voltage Safety Index (Safe / Overvoltage)</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', color: '#10b981', fontWeight: 800, fontFamily: 'monospace' }}>SAFE</span>
              <div style={{ fontSize: '10px', color: '#10b981' }}>✔ Regulated Voltage</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safetyData}>
                <defs>
                  <linearGradient id="safetySpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#0f1711', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="safetyIndex" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#safetySpark)" name="Safety Index %" dot={{ r: 3, fill: '#10b981', stroke: '#04150c', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <span>Normal: &lt; 120V Safe</span>
            <span>Spike Trigger: &gt; 120V Alert</span>
            <span>Compliance: In-Line</span>
          </div>
        </div>

        {/* Graph 4: Power Consumption (kWh) from CSV */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="panel-kicker">ENERGY METRICS (CSV)</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '16px' }}>4. Energy Consumption (kWh) & Grid Freq</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', color: '#10b981', fontWeight: 800, fontFamily: 'monospace' }}>1.32 kWh</span>
              <div style={{ fontSize: '10px', color: '#10b981' }}>⚡ 50.0 Hz Grid Sync</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerConsumptionData}>
                <defs>
                  <linearGradient id="kwhSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#0f1711', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="kwh" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#kwhSpark)" name="Energy (kWh)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <span>Nominal: 0.95 kWh</span>
            <span>Grid Freq: 50.0 Hz</span>
            <span>Surge Peak: 2.60 kWh</span>
          </div>
        </div>

      </div>
    </>
  )
}

function LiveMonitoring({ role, data }) {
  const rows = data.csv_rows || []
  const latest = rows.length > 0 ? rows[rows.length - 1] : {
    timestamp: '2026-11-13 23:00:00',
    voltage: 132,
    fence_status: 'ON',
    safety_status: 'UNSAFE',
    power_consumption: 2.45,
    grid_frequency: 51.6,
    fault_type: 'OVERVOLTAGE_SURGE',
    risk_level: 'HIGH_CRITICAL',
    integrity: 88.5,
    current: 0.70,
    temperature: 23.8,
    battery: 94,
  }

  const isUnsafe = latest.voltage > 120

  // Calculate live counts based on CSV telemetry rows
  const highCriticalCount = rows.filter((r) => r.risk_level === 'HIGH_CRITICAL' || r.voltage > 120).length
  const mediumCount = rows.filter((r) => r.risk_level === 'MEDIUM' || (r.voltage > 115 && r.voltage <= 120)).length
  const lowSafeCount = rows.filter((r) => r.risk_level === 'LOW' && r.voltage <= 115).length

  return (
    <>
      <PageHeading
        eyebrow="REAL-TIME TELEMETRY STREAM"
        title="Live Monitoring"
        description="Comprehensive real-time view of all sensor telemetry and EB electrical parameters loaded from CSV dataset."
      />

      {/* Severity Risk Counts Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              HIGH / CRITICAL RISK COUNT
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {highCriticalCount} Incidents
            </div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
              Voltage &gt; 120V Threshold Exceeded
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              MEDIUM RISK COUNT
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {mediumCount} Incidents
            </div>
            <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>
              Voltage nearing peak (116V - 120V)
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Activity size={20} />
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              LOW / SAFE COUNT
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {lowSafeCount} Normal Cycles
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
              Regulated voltage &lt; 115V safe range
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Primary Live Status Alert Banner with Direct Action Message */}
      <div style={{
        marginTop: '16px',
        padding: '18px 22px',
        borderRadius: '12px',
        background: isUnsafe ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.14)',
        border: `1px solid ${isUnsafe ? '#ef4444' : '#10b981'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: isUnsafe ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            {isUnsafe ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: isUnsafe ? '#fca5a5' : '#86efac', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isUnsafe ? '🚨 LIVE ALERT MESSAGE: FENCE PERIMETER UNSAFE' : '● LIVE STATUS MESSAGE: FENCE PERIMETER SAFE'}
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: '18px', color: '#fff' }}>
              {isUnsafe
                ? `CRITICAL WARNING: Voltage surged to ${latest.voltage}V! (Exceeded 120V safe threshold). Immediate inspection required!`
                : `NORMAL OPERATION: Voltage is operating safely at ${latest.voltage}V. Continuous pulse loop active.`}
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Timestamp: <strong>{latest.timestamp}</strong> · Sector: <strong>Substation Sector E-01</strong> · Status: <span style={{ color: isUnsafe ? '#f87171' : '#34d399', fontWeight: 700 }}>{latest.safety_status}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            padding: '8px 16px',
            borderRadius: '20px',
            background: isUnsafe ? '#ef4444' : '#10b981',
            color: isUnsafe ? '#fff' : '#04150c',
            fontWeight: 800,
            fontSize: '14px',
            letterSpacing: '0.04em',
            display: 'inline-block',
          }}>
            {latest.safety_status}
          </span>
        </div>
      </div>

      {/* Full Telemetry Record Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
        
        {/* Card 1: Voltage */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>1. FENCE VOLTAGE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: isUnsafe ? '#ef4444' : '#10b981', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.voltage} V
          </div>
          <div style={{ fontSize: '11px', color: isUnsafe ? '#f87171' : '#10b981', fontWeight: 600 }}>
            {isUnsafe ? '▲ Over 120V Benchmark' : '✔ Normal Safe Range'}
          </div>
        </div>

        {/* Card 2: Power State */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>2. ENERGIZER POWER</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.fence_status}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
            ⚡ 100% Active Pulse Loop
          </div>
        </div>

        {/* Card 3: Safety Status */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>3. SAFETY STATUS</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: isUnsafe ? '#ef4444' : '#10b981', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.safety_status}
          </div>
          <div style={{ fontSize: '11px', color: isUnsafe ? '#f87171' : '#10b981', fontWeight: 600 }}>
            {isUnsafe ? 'High Risk Condition' : 'Safe Non-Lethal Barrier'}
          </div>
        </div>

        {/* Card 4: Integrity Score */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>4. INTEGRITY SCORE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.integrity}%
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
            ● Wire Continuity Intact
          </div>
        </div>

        {/* Card 5: Power Consumption */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>5. ENERGY USAGE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.power_consumption} <span style={{ fontSize: '14px' }}>kWh</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Hourly energy draw
          </div>
        </div>

        {/* Card 6: Grid Frequency */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>6. GRID FREQUENCY</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#a855f7', margin: '8px 0 4px', fontFamily: 'monospace' }}>
            {latest.grid_frequency} <span style={{ fontSize: '14px' }}>Hz</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Standard EB 50Hz Link
          </div>
        </div>

        {/* Card 7: Fault Classification */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>7. FAULT TYPE</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: isUnsafe ? '#ef4444' : '#10b981', margin: '14px 0 4px', fontFamily: 'monospace' }}>
            {latest.fault_type}
          </div>
          <div style={{ fontSize: '11px', color: isUnsafe ? '#f87171' : '#10b981' }}>
            {isUnsafe ? 'Relay Action Required' : 'No Faults Detected'}
          </div>
        </div>

        {/* Card 8: Risk Level */}
        <div className="stat-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>8. RISK LEVEL</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: isUnsafe ? '#ef4444' : '#10b981', margin: '12px 0 4px', fontFamily: 'monospace' }}>
            {latest.risk_level}
          </div>
          <div style={{ fontSize: '11px', color: isUnsafe ? '#f87171' : '#10b981' }}>
            {isUnsafe ? 'Emergency Alert Tier 1' : 'Normal Operation'}
          </div>
        </div>

      </div>

      {/* CSV Real-Time Telemetry Feed Table */}
      <div className="panel" style={{ padding: '20px', marginTop: '24px' }}>
        <div className="panel-head" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="panel-kicker">HISTORICAL CSV AUDIT STREAM</div>
            <h3 style={{ margin: '4px 0 0', fontSize: '17px' }}>24-Hour Telemetry Log Stream ({rows.length} Readings)</h3>
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Active CSV Data Feed
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>Time</th>
                <th style={{ padding: '10px 12px' }}>Voltage</th>
                <th style={{ padding: '10px 12px' }}>Power</th>
                <th style={{ padding: '10px 12px' }}>Safety</th>
                <th style={{ padding: '10px 12px' }}>Integrity</th>
                <th style={{ padding: '10px 12px' }}>Energy (kWh)</th>
                <th style={{ padding: '10px 12px' }}>Freq (Hz)</th>
                <th style={{ padding: '10px 12px' }}>Fault Type</th>
                <th style={{ padding: '10px 12px' }}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice().reverse().map((r, i) => {
                const rowUnsafe = r.voltage > 120
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowUnsafe ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#f1f5f9' }}>{r.time}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: rowUnsafe ? '#ef4444' : '#10b981' }}>{r.voltage} V</td>
                    <td style={{ padding: '10px 12px' }}>{r.fence_status}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: rowUnsafe ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: rowUnsafe ? '#f87171' : '#34d399' }}>
                        {r.safety_status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{r.integrity}%</td>
                    <td style={{ padding: '10px 12px' }}>{r.power_consumption}</td>
                    <td style={{ padding: '10px 12px' }}>{r.grid_frequency}</td>
                    <td style={{ padding: '10px 12px', color: rowUnsafe ? '#f87171' : '#64748b' }}>{r.fault_type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 600, color: rowUnsafe ? '#ef4444' : '#10b981' }}>{r.risk_level}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Alerts({ role, data }) {
  const [filter, setFilter] = useState('all')
  const [alertsList, setAlertsList] = useState(data.alerts || [])
  const [resolvingId, setResolvingId] = useState(null)

  useEffect(() => {
    setAlertsList(data.alerts || [])
  }, [data.alerts])

  const filtered = filter === 'all'
    ? alertsList
    : filter === 'resolved'
      ? alertsList.filter((a) => a.status === 'resolved')
      : alertsList.filter((a) => a.severity?.toLowerCase() === filter && a.status !== 'resolved')

  const counts = {
    critical: alertsList.filter((a) => a.severity?.toLowerCase() === 'critical' && a.status !== 'resolved').length,
    high: alertsList.filter((a) => a.severity?.toLowerCase() === 'high' && a.status !== 'resolved').length,
    medium: alertsList.filter((a) => a.severity?.toLowerCase() === 'medium' && a.status !== 'resolved').length,
    resolved: alertsList.filter((a) => a.status === 'resolved').length,
  }

  async function handleResolve(alertId) {
    setResolvingId(alertId)
    try {
      const res = await resolveAlert(alertId, 'Problem inspected, wire repaired and perimeter secure.')
      setAlertsList((prev) =>
        prev.map((item) =>
          item.id === alertId
            ? { ...item, status: 'resolved', resolved_by: res.resolved_by, resolution_notes: res.resolution_notes }
            : item
        )
      )
    } catch (err) {
      console.error('Failed to resolve alert:', err)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="EVENT CENTER"
        title="Alerts & incidents"
        description={role === 'forest' ? 'Field events and perimeter alerts that need your attention. Mark them as resolved once inspected!' : 'Electrical events, power changes, and fault notifications.'}
      />
      <div className="alert-summary-grid">
        <SummaryBox label="Critical" value={counts.critical} tone="critical" />
        <SummaryBox label="High priority" value={counts.high} tone="high" />
        <SummaryBox label="Medium" value={counts.medium} tone="medium" />
        <SummaryBox label="Resolved & In Report" value={counts.resolved} tone="resolved" />
      </div>
      <div className="panel full-panel">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">ALERT LOG</div>
            <h3>Recent activity <span className="count-pill">{filtered.length}</span></h3>
          </div>
          <div className="filter-tabs">
            {['all', 'critical', 'high', 'medium', 'resolved'].map((value) => (
              <button
                key={value}
                className={filter === value ? 'filter-tab active' : 'filter-tab'}
                onClick={() => setFilter(value)}
              >
                {value === 'resolved' ? '✔ Resolved' : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {filtered.length ? (
          <div className="alerts-table">
            {filtered.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onResolve={handleResolve} />
            ))}
          </div>
        ) : (
          <EmptyState title="No alerts in this filter" detail="Try choosing a different severity or resolved tab." />
        )}
      </div>
    </>
  )
}

function SummaryBox({ label, value, tone }) { return <div className="summary-box"><span className={`summary-dot ${tone}`} /><div><strong>{value}</strong><small>{label}</small></div></div> }

function Reports({ role, data }) {
  const [downloading, setDownloading] = useState('')
  const [error, setError] = useState('')
  const resolvedList = data.resolved_list || []

  async function download(type) {
    setDownloading(type)
    setError('')
    try {
      await downloadReport(type)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to generate report. Please try again.')
    } finally {
      setDownloading('')
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="OFFICIAL AUDIT & EXPORTS"
        title="Resolved Incident Reports"
        description="Only verified and resolved alerts are generated here. Displays who inspected the problem, resolution notes, and the 4 operational fence parameters."
        action={<DataBadge demo={data.demo_mode} />}
      />

      {error && <div className="form-error report-error"><AlertTriangle size={15} />{error}</div>}

      {/* 1. Live Table of Resolved Incidents (Shown at Top as Individual Reports) */}
      <div className="panel" style={{ padding: '22px', marginBottom: '24px' }}>
        <div className="panel-head" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="panel-kicker">RESOLVED INCIDENTS & ACTION LOG</div>
            <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>Individual Incident Clearance Reports</h3>
          </div>
          <span className="count-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', fontSize: '13px' }}>
            {resolvedList.length} Verified & Resolved
          </span>
        </div>

        {resolvedList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {resolvedList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '15px' }}>✔ {item.title}</span>
                    <span style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', borderRadius: '4px', fontWeight: 600 }}>
                      RESOLVED REPORT
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.4' }}>
                    <strong style={{ color: '#94a3b8' }}>Action Taken / Resolution:</strong> {item.resolution_notes || item.detail}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                    📍 Location: <strong style={{ color: '#94a3b8' }}>{item.location}</strong> · 🕒 Cleared on: <strong style={{ color: '#94a3b8' }}>{item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'Recent'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '160px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Inspected & Solved By</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                      👤 {item.resolved_by || 'Officer on duty'}
                    </div>
                  </div>
                  <button
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                    disabled={!!downloading}
                    onClick={() => download('resolved_audit')}
                  >
                    <Download size={13} /> Export PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No resolved incidents yet"
            detail="Go to the Alerts section and click 'Mark as Resolved' on active alerts to generate reports here."
          />
        )}
      </div>
    </>
  )
}

function Locations({ role, data }) {
  return <><PageHeading eyebrow="GEO-SPATIAL VIEW" title="Fence locations" description="Monitor the fence perimeter, sensor locations, and field events on the map." action={<DataBadge demo={data.map_demo || data.demo_mode} />} />{data.demo_mode && <DemoNotice />}<div className="map-layout"><div className="panel map-panel"><div className="panel-head"><div><div className="panel-kicker">NETWORK MAP</div><h3>{data.site_name || 'Western Range'}</h3></div><div className="map-legend"><span><i className="legend-fence" />Fence line</span><span><i className="legend-sensor" />Monitoring point</span><span><i className="legend-alert" />Alert area</span></div></div><FenceMap locations={data.locations || []} boundary={data.boundary || []} /></div><div className="panel map-side"><div className="panel-kicker">MONITORING POINTS</div><h3>Along the perimeter</h3><div className="location-list">{(data.locations || []).map((location) => <div className="location-row" key={location.id}><span className={`location-dot ${location.status}`} /><div><strong>{location.name}</strong><small>{location.description}</small></div><span className={`location-status ${location.status}`}>{location.status_label}</span></div>)}</div><div className="map-info"><MapPin size={16} /><span>Illustrative sample coordinates. Replace these with surveyed fence and sensor GPS coordinates before field deployment.</span></div></div></div></>
}

function OfficerProfile({ role, user, data }) {
  const designation = 'Assistant Executive Engineer (AEE) / Grid Commander'
  const department = 'Tamil Nadu Electricity Board & Power Transmission (TNEB)'
  const division = 'High-Voltage Perimeter Energizer & Substation Distribution Wing'
  const officerName = user.full_name || 'Karthik Raja, AEE'
  const badgeId = 'TNEB-EB-2026-8842'

  return (
    <>
      <PageHeading
        eyebrow="OFFICER CREDENTIALS & ID"
        title="EB Officer Profile"
        description="Official Electricity Board engineer identity, high-voltage clearance credentials, substation control posts, and emergency line dispatch."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', marginTop: '16px' }}>
        {/* Left Column: Official Digital ID Badge */}
        <div className="panel" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 17, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: '#38bdf8',
            color: '#04150c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 800,
            margin: '0 auto 16px',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)'
          }}>
            {initials(officerName)}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px', color: '#f8fafc' }}>{officerName}</h2>
          <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 600 }}>{designation}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>EB Service ID: <strong style={{ color: '#cbd5e1' }}>{badgeId}</strong></div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8' }} />
            ON ACTIVE GRID DUTY
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>EB Username</span>
              <strong style={{ color: '#e2e8f0' }}>@{user.username || 'eb'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Electrical Clearance</span>
              <strong style={{ color: '#38bdf8' }}>Grade 1 High-Tension (HT) License</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Assigned Grid</span>
              <strong style={{ color: '#e2e8f0' }}>Substation SS-04 · 11kV Feeder Line</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Duty Assignments & Contact Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ padding: '24px' }}>
            <div className="panel-kicker">EB OPERATIONAL ASSIGNMENT</div>
            <h3 style={{ margin: '6px 0 16px', fontSize: '17px' }}>Substation Posting & Power Grid Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Operating Board</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px' }}>{department}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Technical Wing</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px' }}>{division}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Line Fault Response</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px' }}>24/7 Rapid Wire Repair & Surge Trip Squad</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Master Control Station</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px' }}>Main Substation Step-up Unit · Sector E-01</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '24px' }}>
            <div className="panel-kicker">EB DISPATCH & HOTLINE</div>
            <h3 style={{ margin: '6px 0 16px', fontSize: '17px' }}>Substation Contact & High-Voltage Line Duty</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>EB Substation Direct Line</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>+91 94433 55210</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Line Fault Emergency Hotline</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>1912 (TNEB 24x7)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Official Board Email</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>aee.perimeter@tnebnet.org</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Settings({ role, user, data }) {
  const [form, setForm] = useState(data)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => setForm(data), [data])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event) {
    event.preventDefault(); setSaved(false); setError('')
    try { setForm(await saveSettings(form)); setSaved(true); setTimeout(() => setSaved(false), 3500) }
    catch (err) { setError(err.response?.data?.detail || 'Could not save your settings.') }
  }
  return <><PageHeading eyebrow="YOUR WORKSPACE" title="Settings" description="Manage alert preferences and how your monitoring workspace behaves." /><form className="settings-layout" onSubmit={submit}><div className="settings-main"><div className="panel settings-panel"><div className="settings-title"><div className="panel-kicker">ALERT PREFERENCES</div><h3>{role === 'forest' ? 'Forest safety thresholds' : 'Electrical thresholds'}</h3><p>Choose when your team should be notified.</p></div>{role === 'forest' ? <Threshold label="Fence integrity alert" description="Alert when fence integrity drops below this level." value={form.integrity_threshold} unit="%" onChange={(v) => update('integrity_threshold', v)} min={50} max={100} /> : <><Threshold label="Low voltage alert" description="Notify when fence voltage falls below this value." value={form.low_voltage_threshold} unit="kV" onChange={(v) => update('low_voltage_threshold', v)} min={1} max={15} step={0.1} /><Threshold label="High voltage alert" description="Notify when fence voltage exceeds this value." value={form.high_voltage_threshold} unit="kV" onChange={(v) => update('high_voltage_threshold', v)} min={5} max={20} step={0.1} /><Threshold label="Current limit" description="Alert when electrical current exceeds this level." value={form.current_threshold} unit="A" onChange={(v) => update('current_threshold', v)} min={0.1} max={5} step={0.1} /></>}<div className="settings-divider" /><SettingToggle label="High-priority alerts" description="Notify immediately for critical incidents." checked={form.critical_alerts} onChange={(v) => update('critical_alerts', v)} /><SettingToggle label="Daily summary" description="Receive a daily status digest by email." checked={form.daily_summary} onChange={(v) => update('daily_summary', v)} /></div><div className="panel settings-panel"><div className="settings-title"><div className="panel-kicker">NOTIFICATION CHANNELS</div><h3>Stay in the loop</h3><p>Choose where updates should reach you.</p></div><SettingToggle label="In-app notifications" description="Show alerts in your FenceWatch workspace." checked={form.in_app_notifications} onChange={(v) => update('in_app_notifications', v)} /><SettingToggle label="Email notifications" description="Send important events to your work email." checked={form.email_notifications} onChange={(v) => update('email_notifications', v)} /></div><div className="settings-actions">{error && <span className="settings-error">{error}</span>}{saved && <span className="saved-message"><Check size={15} /> Changes saved</span>}<button className="primary-button" type="submit">Save changes <ArrowUpRight size={15} /></button></div></div><aside className="settings-side"><div className="panel profile-settings"><div className="panel-kicker">YOUR PROFILE</div><div className="profile-large"><div className="avatar">{initials(user.full_name || user.username)}</div><div><strong>{user.full_name || user.username}</strong><span>{role === 'forest' ? 'Forest Officer' : 'EB Officer'}</span></div></div><div className="profile-field"><span>USERNAME</span><strong>{user.username}</strong></div><div className="profile-field"><span>WORKSPACE</span><strong>{role === 'forest' ? 'Forest Division' : 'Electrical Division'}</strong></div><div className="profile-field"><span>ACCESS LEVEL</span><strong>Officer · Standard</strong></div></div>{data.demo_mode && <div className="panel blynk-card"><div className="blynk-icon"><Radio size={17} /></div><div className="panel-kicker">HARDWARE INTEGRATION</div><h3>Connect your ESP32</h3><p>Configure Blynk credentials in the backend <code>.env</code> file to switch from demo to live telemetry.</p><span className="config-status"><i /> {data.integration_status || 'Demo mode active'}</span></div>}</aside></form></>
}

function Threshold({ label, description, value, unit, onChange, min, max, step = 1 }) { return <div className="threshold-control"><div><strong>{label}</strong><small>{description}</small></div><div className="threshold-input"><input type="number" min={min} max={max} step={step} value={value ?? min} onChange={(e) => onChange(Number(e.target.value))} /><span>{unit}</span></div></div> }
function SettingToggle({ label, description, checked, onChange }) { return <div className="setting-toggle"><div><strong>{label}</strong><small>{description}</small></div><button type="button" role="switch" aria-checked={!!checked} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button></div> }

function LoadingState() { return <div className="loading-state"><span className="spinner" /><strong>Loading monitoring data</strong><small>Connecting to the fence network…</small></div> }
function ErrorState({ message, retry }) { return <div className="panel error-state"><AlertTriangle size={23} /><h3>Something went wrong</h3><p>{message}</p><button className="secondary-button" onClick={retry}>Try again</button></div> }
function EmptyState({ title, detail }) { return <div className="empty-state"><div className="empty-icon"><ShieldCheck size={19} /></div><strong>{title}</strong><span>{detail}</span></div> }

export default App
