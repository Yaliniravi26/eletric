// CSV Data Loader and Local Storage System (Zero Backend, Standalone)

let csvData = []

async function loadCSV() {
  if (csvData.length > 0) return csvData
  try {
    const res = await fetch('/fence_telemetry.csv')
    const text = await res.text()
    const lines = text.trim().split('\n').slice(1)
    csvData = lines.map((line) => {
      const [timestamp, voltage_v, fence_status, safety_status, power_kwh, freq_hz, fault_type, risk_level, integrity_pct, current_a, temp_c, battery_pct] = line.split(',')
      return {
        time: timestamp.split(' ')[1].slice(0, 5),
        timestamp,
        voltage: parseFloat(voltage_v),
        fence_status,
        safety_status,
        power_consumption: parseFloat(power_kwh) || 0.95,
        grid_frequency: parseFloat(freq_hz) || 50.0,
        fault_type: fault_type || 'NONE',
        risk_level: risk_level || 'LOW',
        integrity: parseFloat(integrity_pct),
        current: parseFloat(current_a),
        temperature: parseFloat(temp_c),
        battery: parseFloat(battery_pct),
      }
    })
  } catch (err) {
    console.error('Failed to parse CSV:', err)
  }
  return csvData
}

function initStorage() {
  if (!localStorage.getItem('fw_alerts')) {
    const initialAlerts = [
      {
        id: 101,
        title: 'HIGH VOLTAGE SURGE (> 120V / Surge Detected)',
        detail: 'Line voltage surged to 132V (Exceeded 120V threshold)! Relay triggered on hardware.',
        category: 'voltage',
        category_label: 'Voltage event',
        severity: 'critical',
        location: 'Substation Step-up Transformer · Sector E-01',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 1,
        title: 'HIGH VOLTAGE SURGE (> 120V / Surge Detected)',
        detail: 'Line voltage spiked to 135V at 09:00. Risk of energizer breakdown.',
        category: 'voltage',
        category_label: 'Voltage event',
        severity: 'critical',
        location: 'Substation Step-up Transformer · Sector E-01',
        status: 'resolved',
        created_at: '2026-11-13T09:00:00Z',
        resolved_by: 'Arun Silva',
        resolved_at: '2026-11-13T10:15:00Z',
        resolution_notes: 'Ground team inspected surge suppressor and tested with 8.4kV pulses.',
      },
      {
        id: 2,
        title: 'HIGH VOLTAGE SURGE (> 120V / Surge Detected)',
        detail: 'Line voltage spiked to 128V at 20:00. Relay triggered.',
        category: 'voltage',
        category_label: 'Voltage event',
        severity: 'critical',
        location: 'Substation Step-up Transformer · Sector E-01',
        status: 'resolved',
        created_at: '2026-11-13T20:00:00Z',
        resolved_by: 'Arun Silva',
        resolved_at: '2026-11-13T21:05:00Z',
        resolution_notes: 'Power stabilization circuit balanced and continuity verified.',
      },
      {
        id: 3,
        title: 'HIGH VOLTAGE SURGE (> 120V / Surge Detected)',
        detail: 'Line voltage spiked to 125V at 14:00. Exceeded 120V threshold limit.',
        category: 'voltage',
        category_label: 'Voltage event',
        severity: 'critical',
        location: 'East Perimeter · Sector E-02',
        status: 'resolved',
        created_at: '2026-11-13T14:00:00Z',
        resolved_by: 'Arun Silva',
        resolved_at: '2026-11-13T15:00:00Z',
        resolution_notes: 'Inspected transformer tap settings and normal voltage restored.',
      },
      {
        id: 4,
        title: 'HIGH VOLTAGE SURGE (> 120V / Surge Detected)',
        detail: 'Line voltage spiked to 122V at 07:00. Morning load fluctuation.',
        category: 'voltage',
        category_label: 'Voltage event',
        severity: 'critical',
        location: 'North Perimeter · Sector E-01',
        status: 'resolved',
        created_at: '2026-11-13T07:00:00Z',
        resolved_by: 'Arun Silva',
        resolved_at: '2026-11-13T07:45:00Z',
        resolution_notes: 'Auto-trip reset and circuit impedance tested successfully.',
      },
    ]
    localStorage.setItem('fw_alerts', JSON.stringify(initialAlerts))
  }
}
initStorage()

function getAlertsFromStore() {
  try {
    return JSON.parse(localStorage.getItem('fw_alerts')) || []
  } catch {
    return []
  }
}

function saveAlertsToStore(alerts) {
  localStorage.setItem('fw_alerts', JSON.stringify(alerts))
}

export async function login(username, password, role) {
  const user = {
    username: username || 'eb',
    full_name: 'Arun Silva',
    role: 'eb_officer',
    access_level: 'EB Senior Engineer',
  }
  localStorage.setItem('fencewatch_token', 'local-token-' + Date.now())
  localStorage.setItem('fencewatch_user', JSON.stringify(user))
  return user
}

export async function register(fullName, username, password, role) {
  const user = {
    username: username.trim(),
    full_name: fullName.trim(),
    role: 'eb_officer',
  }
  localStorage.setItem('fencewatch_token', 'local-token-' + Date.now())
  localStorage.setItem('fencewatch_user', JSON.stringify(user))
  return user
}

export async function getDashboard() {
  const rows = await loadCSV()
  const alerts = getAlertsFromStore()
  const latest = rows.length > 0 ? rows[rows.length - 1] : { voltage: 108, integrity: 98.8, fence_status: 'ON', safety_status: 'SAFE' }
  const isSafe = latest.voltage <= 120

  const stats = [
    {
      label: 'Fence Voltage (CSV Feed)',
      value: `${latest.voltage} V`,
      unit: '',
      change: 'Active',
      trend: 'up',
      health: Math.min(100, Math.round((latest.voltage / 120) * 100)),
      footnote: 'dataset telemetry feed',
    },
    {
      label: 'Fence Power State',
      value: latest.fence_status,
      unit: '',
      change: 'Energized',
      trend: 'up',
      health: 100,
      footnote: 'continuous pulse state',
    },
    {
      label: 'Electrical Safety Status',
      value: isSafe ? 'SAFE' : 'UNSAFE',
      unit: '',
      change: isSafe ? 'Perimeter Secure' : 'Overvoltage Spike (>120V)',
      trend: isSafe ? 'up' : 'down',
      health: isSafe ? 98 : 20,
      footnote: isSafe ? 'non-lethal safety margin' : 'Critical surge detected (>120V)',
    },
    {
      label: 'Integrity Score',
      value: latest.integrity,
      unit: '%',
      change: 'Optimal',
      trend: 'up',
      health: Math.round(latest.integrity),
      footnote: 'loop circuit efficiency',
    },
  ]

  // Sampling 10 intervals from CSV for Dashboard Chart
  const chart = rows.filter((_, idx) => idx % 2 === 0).map((r) => ({
    time: r.time,
    voltage: r.voltage,
    integrity: r.integrity,
  }))

  return {
    demo_mode: false,
    site_name: 'Western Range · Section 04',
    updated_at: new Date().toISOString(),
    status_label: 'PERIMETER SECURE',
    uptime: 99.2,
    stats,
    chart,
    alerts: alerts.slice(0, 5),
    sensors: [
      { name: 'Line voltage', description: 'Energizer output', value: `${latest.voltage}`, unit: 'V', icon: 'power', status: isSafe ? 'normal' : 'warning' },
      { name: 'Power consumption', description: 'Energy consumption (kWh)', value: `${latest.power_consumption || 0.95}`, unit: 'kWh', icon: 'power', status: 'normal' },
      { name: 'Grid frequency', description: 'EB standard frequency', value: `${latest.grid_frequency || 50.0}`, unit: 'Hz', icon: 'sensor', status: 'normal' },
      { name: 'Fault classification', description: `Risk: ${latest.risk_level || 'LOW'}`, value: latest.fault_type || 'NONE', unit: '', icon: 'temperature', status: isSafe ? 'normal' : 'warning' },
    ],
    reading_count: rows.length,
  }
}

export async function getReadings() {
  const rows = await loadCSV()
  const latest = rows.length > 0 ? rows[rows.length - 1] : { voltage: 108 }
  return {
    demo_mode: false,
    readings: [
      { name: 'Fence voltage', value: latest.voltage, unit: 'V', status: 'normal', status_label: 'CSV Data' },
      { name: 'Current', value: 0.45, unit: 'A', status: 'normal', status_label: 'Normal' },
      { name: 'Temperature', value: 24.0, unit: '°C', status: 'normal', status_label: 'Normal' },
      { name: 'Humidity', value: 65.0, unit: '%', status: 'normal', status_label: 'Normal' },
      { name: 'Battery', value: 96.0, unit: '%', status: 'normal', status_label: 'Healthy' },
      { name: 'Animal intrusion', value: 'Clear', unit: '', status: 'normal', status_label: 'No activity' },
      { name: 'Fence status', value: 'Energized', unit: '', status: 'normal', status_label: 'Energized' },
    ],
    csv_rows: rows,
  }
}

export async function getAlerts() {
  const alerts = getAlertsFromStore()
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    high: alerts.filter((a) => a.severity === 'high' && a.status !== 'resolved').length,
    medium: alerts.filter((a) => a.severity === 'medium' && a.status !== 'resolved').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  }
  return { alerts, counts, demo_mode: false }
}

export async function getLocations() {
  const base_lat = 8.321
  const base_lon = 77.104
  return {
    site_name: 'Western Ghats Forest Range · Zone 04',
    locations: [
      { id: 1, name: 'Energizer Station Alpha', description: 'Primary Pulsator · 10kV Pulse Unit', latitude: base_lat, longitude: base_lon, status: 'healthy', status_label: 'Energized', type: 'power' },
      { id: 2, name: 'Circuit A Monitoring Point', description: 'North Loop · 1.2 km Span', latitude: base_lat + 0.007, longitude: base_lon - 0.01, status: 'healthy', status_label: 'Normal', type: 'voltage' },
      { id: 3, name: 'Circuit B Monitoring Point', description: 'East Loop · 0.8 km Span', latitude: base_lat + 0.01, longitude: base_lon + 0.001, status: 'warning', status_label: 'Load Surged', type: 'current' },
      { id: 4, name: 'Circuit C Monitoring Point', description: 'South Loop · 1.6 km Span', latitude: base_lat - 0.007, longitude: base_lon + 0.004, status: 'healthy', status_label: 'Normal', type: 'voltage' },
      { id: 5, name: 'Backup Battery Bank 2', description: 'Solar Station West · LiFePO4 48V', latitude: base_lat - 0.005, longitude: base_lon - 0.007, status: 'danger', status_label: 'Low Voltage Fault', type: 'battery' },
    ],
  }
}

export async function getReports() {
  const alerts = getAlertsFromStore()
  const resolvedList = alerts.filter((a) => a.status === 'resolved')
  return {
    resolved_count: resolvedList.length,
    resolved_list: resolvedList,
    reports: [
      {
        id: 'resolved_audit',
        period: 'OFFICIAL AUDIT REPORT',
        title: 'Resolved Incidents & Remediation Report',
        description: 'Complete audit of resolved fence problems: who inspected and resolved them, resolution notes, and verified field actions.',
        date_range: 'All Resolved Incidents',
        record_count: resolvedList.length,
      },
      {
        id: 'daily',
        period: 'OPERATIONAL LOG',
        title: 'Daily Field Clearance Summary',
        description: '24-hour log of verified fence issues marked as resolved by officers on duty.',
        date_range: 'Last 24 hours',
        record_count: resolvedList.length,
      },
    ],
  }
}

export async function getSettings() {
  return {
    role: 'eb_officer',
    integrity_threshold: 80,
    low_voltage_threshold: 5.0,
    high_voltage_threshold: 12.0,
    current_threshold: 1.5,
    critical_alerts: true,
    daily_summary: false,
    in_app_notifications: true,
    email_notifications: false,
  }
}

export async function saveSettings(payload) {
  return payload
}

export async function downloadReport(reportType) {
  const alerts = getAlertsFromStore().filter((a) => a.status === 'resolved')
  let content = `FENCEWATCH INCIDENT CLEARANCE REPORT (CSV DATASET AUDIT)\nType: ${reportType.toUpperCase()}\nGenerated on: ${new Date().toLocaleString()}\n\n`
  alerts.forEach((a, i) => {
    content += `${i + 1}. [${a.severity.toUpperCase()}] ${a.title}\n   Location: ${a.location}\n   Solved by: ${a.resolved_by || 'Officer'}\n   Resolution: ${a.resolution_notes || 'Inspected and cleared'}\n   Cleared Date: ${a.resolved_at || a.created_at}\n\n`
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${reportType}-fence-report.txt`
  link.click()
  URL.revokeObjectURL(url)
}

export async function acknowledgeAlert(alertId) {
  const alerts = getAlertsFromStore()
  const item = alerts.find((a) => a.id === alertId)
  if (item) {
    item.status = 'acknowledged'
    saveAlertsToStore(alerts)
  }
  return item
}

export async function resolveAlert(alertId, notes = '') {
  const alerts = getAlertsFromStore()
  const item = alerts.find((a) => a.id === alertId)
  if (item) {
    item.status = 'resolved'
    item.resolved_by = 'Arun Silva (EB Officer)'
    item.resolved_at = new Date().toISOString()
    item.resolution_notes = notes || 'Problem inspected, wire repaired and perimeter secure.'
    saveAlertsToStore(alerts)
  }
  return item
}

export async function changePassword() {
  return { message: 'Password updated' }
}

export async function logout() {
  localStorage.removeItem('fencewatch_token')
  localStorage.removeItem('fencewatch_user')
}

export default {}
