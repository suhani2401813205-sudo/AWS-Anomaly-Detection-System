import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Globe from 'react-globe.gl'

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  CloudRain,
  CloudSun,
  Database,
  Gauge,
  Globe2,
  LayoutDashboard,
  Menu,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Wind,
  X,
  Zap
} from 'lucide-react'

import './styles.css'


// =====================================
// FALLBACK MOCK STATIONS
// =====================================

const mockStations = [
  {
    id: 'AWS_001',
    city: 'Pune',
    region: 'Maharashtra',
    lat: 18.52,
    lng: 73.86,
    status: 'Warning',
    color: '#ffc857',
    risk: 62,
    temp: 31.4,
    humidity: 68,
    pressure: 1009,
    wind: 14,
    rainfall: 2.4,
    updated: '2 min ago'
  },
  {
    id: 'AWS_002',
    city: 'Mumbai',
    region: 'Maharashtra',
    lat: 19.07,
    lng: 72.87,
    status: 'Healthy',
    color: '#55d6a3',
    risk: 24,
    temp: 29.8,
    humidity: 78,
    pressure: 1011,
    wind: 19,
    rainfall: 4.8,
    updated: '1 min ago'
  },
  {
    id: 'AWS_003',
    city: 'Nashik',
    region: 'Maharashtra',
    lat: 20.01,
    lng: 73.78,
    status: 'Critical',
    color: '#ff6b5f',
    risk: 92,
    temp: 39.6,
    humidity: 42,
    pressure: 997,
    wind: 31,
    rainfall: 0,
    updated: '4 min ago'
  },
  {
    id: 'AWS_004',
    city: 'Delhi',
    region: 'NCT Delhi',
    lat: 28.61,
    lng: 77.21,
    status: 'High Risk',
    color: '#ff9955',
    risk: 74,
    temp: 35.2,
    humidity: 54,
    pressure: 1004,
    wind: 22,
    rainfall: 0.8,
    updated: '3 min ago'
  },
  {
    id: 'AWS_005',
    city: 'Bengaluru',
    region: 'Karnataka',
    lat: 12.97,
    lng: 77.59,
    status: 'Healthy',
    color: '#55d6a3',
    risk: 18,
    temp: 24.7,
    humidity: 74,
    pressure: 1014,
    wind: 11,
    rainfall: 6.2,
    updated: '1 min ago'
  },
  {
    id: 'AWS_006',
    city: 'Kolkata',
    region: 'West Bengal',
    lat: 22.57,
    lng: 88.36,
    status: 'Warning',
    color: '#ffc857',
    risk: 58,
    temp: 30.9,
    humidity: 81,
    pressure: 1008,
    wind: 17,
    rainfall: 8.9,
    updated: '5 min ago'
  },
  {
    id: 'AWS_007',
    city: 'Jaipur',
    region: 'Rajasthan',
    lat: 26.91,
    lng: 75.78,
    status: 'Healthy',
    color: '#55d6a3',
    risk: 27,
    temp: 37.1,
    humidity: 31,
    pressure: 1002,
    wind: 26,
    rainfall: 0,
    updated: '2 min ago'
  }
]


// =====================================
// PARAMETERS
// =====================================

const parameters = {
  Temperature: {
    icon: Thermometer,
    unit: '°C',
    value: '29.8',
    min: '21.2',
    max: '41.7',
    trend: '+2.8%',
    trendLabel: 'vs last hour',
    label: 'Temperature over time',
    color: '#ff9e70',
    chart: [27.1, 28.4, 27.8, 30.2, 29.3, 31.8, 30.6, 33.1, 32.4, 35.2, 34.7, 36.6],
    anomalies: '4 active',
    insight: 'Heat pockets detected across western grid'
  },

  Humidity: {
    icon: CloudSun,
    unit: '%',
    value: '68',
    min: '42',
    max: '91',
    trend: '-4.2%',
    trendLabel: 'vs last hour',
    label: 'Humidity over time',
    color: '#72c9e8',
    chart: [74, 77, 73, 79, 76, 71, 74, 67, 70, 65, 63, 68],
    anomalies: '3 active',
    insight: 'Drying trend emerging in central stations'
  },

  Wind: {
    icon: Wind,
    unit: 'km/h',
    value: '14',
    min: '4',
    max: '47',
    trend: '+6.4%',
    trendLabel: 'vs last hour',
    label: 'Wind speed over time',
    color: '#b49cff',
    chart: [9, 12, 10, 16, 14, 19, 17, 22, 20, 26, 23, 28],
    anomalies: '2 active',
    insight: 'Gust activity building near northern corridor'
  },

  Rainfall: {
    icon: CloudRain,
    unit: 'mm',
    value: '4.8',
    min: '0',
    max: '82',
    trend: '+12.1%',
    trendLabel: 'vs last hour',
    label: 'Rainfall over time',
    color: '#5ed9c3',
    chart: [1.2, 2.8, 1.8, 5.2, 4.1, 8.7, 6.4, 12.3, 10.8, 18.6, 15.9, 22.4],
    anomalies: '5 active',
    insight: 'Monsoon cells approaching east network'
  },

  Pressure: {
    icon: Gauge,
    unit: 'hPa',
    value: '1009',
    min: '998',
    max: '1022',
    trend: '-0.8%',
    trendLabel: 'vs last hour',
    label: 'Atmospheric pressure over time',
    color: '#e6bf69',
    chart: [1014, 1012, 1013, 1010, 1011, 1008, 1010, 1006, 1007, 1004, 1006, 1002],
    anomalies: '2 active',
    insight: 'Pressure trough forming around Maharashtra'
  }
}


const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Live Data', Radio],
  ['Stations', Globe2],
  ['Alerts', Bell],
  ['Anomalies', Zap],
  ['Reports', BarChart3],
  ['System Health', ShieldCheck],
  ['Settings', Settings],
  ['About', CircleHelp]
]


// =====================================
// MINI CHART
// =====================================

function MiniChart({ data, color, height = 58 }) {

  const low = Math.min(...data)
  const high = Math.max(...data)
  const spread = high - low || 1

  const points = data
    .map(
      (value, index) =>
        `${(index / (data.length - 1)) * 100},${
          height - ((value - low) / spread) * (height - 5) - 3
        }`
    )
    .join(' ')

  const area = `0,${height} ${points} 100,${height}`

  return (
    <svg
      className="mini-chart"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon points={area} fill="url(#chartFill)" />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}


// =====================================
// STAT CARD
// =====================================

function StatCard({ label, value, tone, icon: Icon }) {

  return (
    <div className="stat-card">

      <div className={`stat-icon ${tone}`}>
        <Icon size={15} />
      </div>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

    </div>
  )
}


// =====================================
// STATUS PILL
// =====================================

function StatusPill({ status }) {

  return (
    <span
      className={`status-pill ${String(status)
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <i />
      {status}
    </span>
  )
}


// =====================================
// APP
// =====================================

function App() {

  const [activeNav, setActiveNav] = useState('Dashboard')
  const [parameter, setParameter] = useState('Temperature')

  const [liveData, setLiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedStation, setSelectedStation] = useState(null)

  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [globeAnimation, setGlobeAnimation] = useState(true)

  const [theme, setTheme] = useState('dark')

  const [unreadAlerts, setUnreadAlerts] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const [liveParameter, setLiveParameter] = useState(null)

  const [criticalIndex, setCriticalIndex] = useState(0)

  const globeRef = useRef()


  const current = parameters[parameter]


  // =====================================
  // CREATE STATIONS FROM LIVE BACKEND DATA
  // =====================================

  const stations =
    liveData && Array.isArray(liveData.stations)
      ? liveData.stations
          .filter((item) => !item.error)
          .map((item) => {

            const weather = item.weather_data || {}
            const m2 = item.m2 || {}
            const m3 = item.m3 || {}
            const m4 = item.m4 || {}

            // Get results directly from backend modules
const risk = Math.round(
  Number(m4.risk_score ?? 0)
)

// Module 4 decides severity.
// If severity is missing, only use ML result as a fallback.
// M2 detects ML anomaly
const mlStatus = String(
  m2.ml_status ??
  m2.status ??
  ''
).toLowerCase()

// M3 detects rule-based anomaly
const m3Anomaly = Boolean(m3.anomaly)

// M4 provides final severity
const m4Severity = String(
  m4.severity ??
  ''
).toUpperCase()

let status = 'Healthy'

// If M2 OR M3 detects an anomaly
if (
  mlStatus.includes('anomaly') ||
  m3Anomaly
) {
  status = 'Warning'
}

// Convert M4 severity to frontend status names
if (m4Severity === 'HIGH') {
  status = 'High Risk'
}

if (m4Severity === 'VERY HIGH') {
  status = 'Critical'
}

if (m4Severity === 'LOW') {
  status = 'Healthy'
}
// Frontend only assigns display color
const statusColors = {
  Healthy: '#55d6a3',
  Warning: '#ffc857',
  'High Risk': '#ff9955',
  Critical: '#ff6b5f'
}

const color =
  statusColors[status] ?? '#55d6a3'
            return {

              id: item.station?.id || 'Unknown',

              city:
                item.station?.city ||
                item.station?.name ||
                'Unknown',

              region:
                item.station?.region ||
                item.station?.state ||
                'Unknown',

              lat:
                Number(item.station?.latitude) || 0,

              lng:
                Number(item.station?.longitude) || 0,

              status,
              color,
              risk,

              temp:
                Number(weather.temperature ?? 0),

              humidity:
                Number(weather.humidity ?? 0),

              pressure:
                Number(weather.pressure ?? 0),

              wind:
                Number(weather.wind_speed ?? 0),

              rainfall:
                Number(weather.rainfall ?? 0),

              updated: 'Just now',

              m2,
              m3,
              m4,

              sensorHealth:
                m4.sensor_health ?? 100,

              severity:
                m4.severity ?? status,

              explanation:
                m4.explanation ??
                m3.explanation ??
                'No anomaly detected'
            }

          })
      : mockStations


  // =====================================
  // ANOMALIES
  // =====================================

  const anomalyRows = stations
    .filter((station) => {

      const mlStatus = String(
        station.m2?.ml_status ??
        station.m2?.status ??
        ''
      ).toLowerCase()

      const m4Anomaly =
        String(
          station.m4?.anomaly ??
          station.m4?.status ??
          ''
        ).toLowerCase()

      return (
        mlStatus.includes('anomaly') ||
        m4Anomaly.includes('anomaly') ||
        station.status === 'Critical' ||
        station.status === 'High Risk'
      )
    })
    .map((station) => ({

      station: station.id,

      city: station.city,

     type:
  station.m4?.anomaly_type ??
  station.m3?.anomaly_type ??
  station.m2?.anomaly_type ??
  'Weather Anomaly',

     parameter:
  station.m4?.parameter ??
  station.m3?.parameter ??
  station.m2?.parameter ??
  'Multiple Parameters',

      value:
        station.m2?.detected_value ??
        station.m3?.detected_value ??
        `Risk ${station.risk}`,

      expected:
        station.m2?.expected_value ??
        station.m3?.expected_value ??
        'Normal weather pattern',

      risk: station.risk,

      severity: station.status,

      time: station.updated,

      description: station.explanation
    }))


  // =====================================
  // ALERTS
  // =====================================

  const alerts = stations
  .filter((station) => {

    const mlStatus = String(
      station.m2?.ml_status ??
      station.m2?.status ??
      ''
    ).toLowerCase()

    const mlAnomaly =
      mlStatus.includes('anomaly')

    const m4Anomaly =
      String(
        station.m4?.anomaly ??
        ''
      ).toLowerCase().includes('anomaly')

    return (
      mlAnomaly ||
      m4Anomaly ||
      station.status === 'Warning' ||
      station.status === 'High Risk' ||
      station.status === 'Critical'
    )
  })

    .map((station) => ({

      station: station.id,

      type:
        station.m2?.anomaly_type ??
        'Weather Anomaly',

      severity: station.status,

      risk: station.risk,

      time: station.updated,

      description: station.explanation,
anomalyType: station.m4?.anomaly_type ?? station.m3?.anomaly_type ?? 'Weather Anomaly'
    }))


  // =====================================
  // CRITICAL ANOMALY CARD
  // =====================================

  const criticalAnomalies =
    anomalyRows.length > 0
      ? anomalyRows
      : [
          {
            station: 'SYSTEM',
            city: 'Network',
            type: 'No active anomaly',
            parameter: 'All parameters',
            value: 'Normal',
            expected: 'Normal',
            risk: 0,
            severity: 'Healthy',
            time: 'Just now'
          }
        ]


  // =====================================
  // STATION COUNTS
  // =====================================

  const stationCounts = stations.reduce(
    (counts, station) => {

      counts[station.status] =
        (counts[station.status] || 0) + 1

      return counts

    },
    {}
  )


  const activeAnomalies = anomalyRows.length


  // =====================================
  // FETCH LIVE DATA
  // =====================================

  useEffect(() => {

    const fetchLiveData = async () => {

      try {

        setLoading(true)
        setError(null)

        const response = await fetch(
          'http://127.0.0.1:8000/predict/live'
        )

        if (!response.ok) {

          throw new Error(
            `Failed to fetch live weather data: ${response.status}`
          )
        }

        const data = await response.json()

        console.log(
          'LIVE BACKEND DATA:',
          JSON.stringify(data, null, 2)
        )

        setLiveData(data)

      } catch (err) {

        console.error('Backend error:', err)

        setError(err.message)

      } finally {

        setLoading(false)

      }

    }


    fetchLiveData()


    const interval = setInterval(
      fetchLiveData,
      60000
    )


    return () =>
      clearInterval(interval)

  }, [])


  // =====================================
  // UPDATE UNREAD ALERTS
  // =====================================

  useEffect(() => {

    const newAlertIds = alerts.map(
      (alert) =>
        `${alert.station}-${alert.type}`
    )

    setUnreadAlerts((currentUnread) => {

      const stillValid =
        currentUnread.filter((id) =>
          newAlertIds.includes(id)
        )

      const newOnes =
        newAlertIds.filter(
          (id) => !stillValid.includes(id)
        )

      return [
        ...stillValid,
        ...newOnes
      ]

    })

  }, [liveData])


  // =====================================
  // GLOBE AUTO ROTATION
  // =====================================

  useEffect(() => {

    const controls =
      globeRef.current?.controls()

    if (!controls) return

    controls.autoRotate =
      autoRotate && globeAnimation

    controls.autoRotateSpeed = 0.5

  }, [autoRotate, globeAnimation])


  // =====================================
  // RESET CRITICAL INDEX
  // =====================================

  useEffect(() => {

    setCriticalIndex(0)

  }, [criticalAnomalies.length])


  // =====================================
  // AUTO ROTATE ANOMALIES
  // =====================================

  useEffect(() => {

    if (
      criticalAnomalies.length <= 1
    ) return undefined

    const timer = setInterval(() => {

      setCriticalIndex(
        (index) =>
          (index + 1) %
          criticalAnomalies.length
      )

    }, 7000)

    return () =>
      clearInterval(timer)

  }, [criticalAnomalies.length])


  // =====================================
  // CLOSE NOTIFICATIONS
  // =====================================

  useEffect(() => {

    const close = () =>
      setNotificationsOpen(false)

    if (!notificationsOpen)
      return undefined

    document.addEventListener(
      'click',
      close
    )

    return () => {

      document.removeEventListener(
        'click',
        close
      )

    }

  }, [notificationsOpen])


  // =====================================
  // SELECT STATION
  // =====================================

  const selectStation = (station) => {

    setSelectedStation(station)

    setActiveNav('Dashboard')

    setAutoRotate(false)

    setSearchTerm('')

    setNotificationsOpen(false)

    const controls =
      globeRef.current?.controls()

    if (controls) {

      controls.autoRotate = false

    }

  }


  const openNav = (name) => {

    setActiveNav(name)

    setSidebarOpen(false)

  }


  // =====================================
  // MARK ALERT READ
  // =====================================

  const markAlertRead = (alert) => {

    setUnreadAlerts(
      (currentUnread) =>
        currentUnread.filter(
          (id) =>
            id !==
            `${alert.station}-${alert.type}`
        )
    )

    const station = stations.find(
      (item) =>
        item.id === alert.station
    )

    if (station) {

      selectStation(station)

    }

  }


  // =====================================
  // SEARCH
  // =====================================

  const searchResults =
    searchTerm.trim()
      ? [

          ...stations
            .filter((station) =>
              `${station.id} ${station.city} ${station.region} ${station.status}`
                .toLowerCase()
                .includes(
                  searchTerm.toLowerCase()
                )
            )
            .map((station) => ({
              type: 'Station',
              label: station.id,
              detail: `${station.city}, ${station.region}`,
              action: () =>
                selectStation(station)
            })),

          ...alerts
            .filter((alert) =>
              `${alert.station} ${alert.type} ${alert.severity} ${alert.description}`
                .toLowerCase()
                .includes(
                  searchTerm.toLowerCase()
                )
            )
            .map((alert) => ({
              type: 'Alert',
              label: `${alert.station} · ${alert.type}`,
              detail: `${alert.severity} · risk ${alert.risk}`,
              action: () =>
                markAlertRead(alert)
            })),

          ...Object.keys(parameters)
            .filter((name) =>
              name
                .toLowerCase()
                .includes(
                  searchTerm.toLowerCase()
                )
            )
            .map((name) => ({
              type: 'Parameter',
              label: name,
              detail:
                parameters[name].label,

              action: () => {

                setParameter(name)

                setActiveNav('Dashboard')

                setSearchTerm('')

              }
            }))

        ].slice(0, 6)

      : []


  const markAllRead = () =>
    setUnreadAlerts([])


  return (

    <div
      className={`app-shell ${
        theme === 'light'
          ? 'light-theme'
          : ''
      }`}
    >

      <aside
        className={`sidebar ${
          isSidebarOpen
            ? 'open'
            : ''
        }`}
      >

        <div className="brand">

          <div className="brand-mark">
            <Activity size={21} />
          </div>

          <div>

            <strong>
              ATMOS<span>AI</span>
            </strong>

            <small>
              WEATHER INTELLIGENCE
            </small>

          </div>

        </div>

        <div className="nav-label">
          Workspace
        </div>

        <nav>

          {navItems.map(
            ([name, Icon]) => (

              <button
                key={name}
                className={
                  activeNav === name
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  openNav(name)
                }
              >

                <Icon size={17} />

                <span>{name}</span>

                {name === 'Alerts' &&
                  unreadAlerts.length > 0 && (

                    <b className="nav-badge">
                      {unreadAlerts.length}
                    </b>

                  )}

              </button>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="operator">

            <div className="avatar">
              RK
            </div>

            <div>

              <strong>
                Riya Kapoor
              </strong>

              <small>
                System operator
              </small>

            </div>

            <ChevronDown size={14} />

          </div>

          <div className="system-status">

            <i />

            All systems operational

          </div>

        </div>

      </aside>


      <main className="main-view">

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(
                !isSidebarOpen
              )
            }
          >

            <Menu size={20} />

          </button>


          <div>

            <div className="eyebrow">

              <span className="live-dot" />

              LIVE MONITORING

              <span className="slash">
                /
              </span>

              WESTERN INDIA GRID

            </div>

            <h1>

              {activeNav === 'Dashboard'
                ? 'Command center'
                : activeNav}

            </h1>

          </div>


          <div className="top-actions">

            <div className="last-sync">

              <span>
                Last sync
              </span>

              <strong>

                {loading
                  ? 'Syncing...'
                  : error
                    ? 'Offline'
                    : 'Live'}

              </strong>

              <i />

            </div>


            <div className="global-search">

              <Search size={15} />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search stations, alerts..."
              />

              <button
                className="search-clear"
                onClick={() =>
                  setSearchTerm('')
                }
                aria-label="Clear search"
              >

                {searchTerm
                  ? <X size={13} />
                  : null}

              </button>


              {searchTerm && (

                <div className="search-results">

                  {searchResults.length ? (

                    searchResults.map(
                      (result) => (

                        <button
                          key={`${result.type}-${result.label}`}
                          onClick={
                            result.action
                          }
                        >

                          <span>
                            {result.type}
                          </span>

                          <strong>
                            {result.label}
                          </strong>

                          <small>
                            {result.detail}
                          </small>

                        </button>

                      )
                    )

                  ) : (

                    <div className="search-empty">
                      No stations, alerts, or parameters found
                    </div>

                  )}

                </div>

              )}

            </div>


            <div className="notification-wrap">

              <button
                className={`icon-button notification ${
                  notificationsOpen
                    ? 'active'
                    : ''
                }`}
                onClick={(event) => {

                  event.stopPropagation()

                  setNotificationsOpen(
                    (open) => !open
                  )

                }}
              >

                <Bell size={17} />

                {unreadAlerts.length > 0 && (
                  <b>
                    {unreadAlerts.length}
                  </b>
                )}

              </button>


              {notificationsOpen && (

                <NotificationPanel
                  alerts={alerts}
                  unreadAlerts={unreadAlerts}
                  markAlertRead={markAlertRead}
                  markAllRead={markAllRead}
                />

              )}

            </div>

          </div>

        </header>


        {activeNav !== 'Dashboard' ? (

          <SecondaryView
            view={activeNav}
            stations={stations}
            alerts={alerts}
            anomalyRows={anomalyRows}
            setActiveNav={setActiveNav}
            selectStation={selectStation}
            theme={theme}
            setTheme={setTheme}
            markAlertRead={markAlertRead}
            liveParameter={liveParameter}
            setLiveParameter={setLiveParameter}
            globeAnimation={globeAnimation}
            setGlobeAnimation={setGlobeAnimation}
          />

        ) : (

          <div className="dashboard-content">

            <section className="stats-row">

              <StatCard
                label="Total stations"
                value={stations.length}
                tone="cyan"
                icon={Globe2}
              />

              <StatCard
                label="Healthy"
                value={
                  stationCounts.Healthy || 0
                }
                tone="green"
                icon={Check}
              />

              <StatCard
                label="Warning"
                value={
                  stationCounts.Warning || 0
                }
                tone="yellow"
                icon={AlertTriangle}
              />

              <StatCard
                label="High Risk"
                value={
                  stationCounts['High Risk'] || 0
                }
                tone="orange"
                icon={AlertTriangle}
              />

              <StatCard
                label="Critical"
                value={
                  stationCounts.Critical || 0
                }
                tone="red"
                icon={Zap}
              />


              <div className="anomaly-stat">

                <div className="anomaly-pulse">
                  <Zap size={15} />
                </div>

                <div>

                  <p>
                    Active anomalies
                  </p>

                  <strong>

                    {activeAnomalies}

                    <small>
                      currently active
                    </small>

                  </strong>

                </div>

              </div>

            </section>


            <section className="workspace-grid">

              <div className="center-stage">

                <div className="stage-heading">

                  <div>

                    <span className="section-kicker">

                      NETWORK MAP ·
                      {' '}
                      {parameter.toUpperCase()}
                      {' '}
                      LAYER

                    </span>

                    <h2>

                      Station coverage

                      <span>
                        · {stations.length} online
                      </span>

                    </h2>

                  </div>


                  <button
                    className={`map-control ${
                      autoRotate && globeAnimation
                        ? 'on'
                        : 'off'
                    }`}
                    onClick={() =>
                      setAutoRotate(
                        (currentValue) =>
                          !currentValue
                      )
                    }
                  >

                    <span className="legend-dot" />

                    Auto rotate

                    <b>

                      {autoRotate &&
                      globeAnimation
                        ? 'ON'
                        : 'OFF'}

                    </b>

                  </button>

                </div>


                <div className="globe-wrap">

                  <Globe
                    ref={globeRef}
                    width={600}
                    height={450}
                    backgroundColor="rgba(0,0,0,0)"

                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"

                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"

                    showAtmosphere

                    atmosphereColor="#48cbe3"

                    atmosphereAltitude={0.16}

                    pointsData={stations}

                    pointLat="lat"

                    pointLng="lng"

                    pointColor="color"

                    pointsMerge={false}

                    onPointClick={selectStation}

                    pointRadius={(station) =>
                      0.28 +
                      station.risk / 300
                    }

                    pointAltitude={() => 0.03}

                    pointLabel={(station) => {

                      const value =
                        parameter === 'Temperature'
                          ? station.temp
                          : parameter === 'Humidity'
                            ? station.humidity
                            : parameter === 'Wind'
                              ? station.wind
                              : parameter === 'Rainfall'
                                ? station.rainfall
                                : station.pressure

                      return `
                        <div class="globe-tooltip">
                          <b>${station.id}</b><br/>
                          ${station.city} · ${station.status}<br/>
                          ${parameter}: ${value}${current.unit}
                        </div>
                      `
                    }}

                  />

                </div>

              </div>


              <aside className="right-panel">

                {selectedStation ? (

                  <StationPanel
                    station={selectedStation}
                    parameter={parameter}

                    onClose={() => {

                      setSelectedStation(null)

                      setAutoRotate(true)

                    }}
                  />

                ) : (

                  <OverviewPanel
                    parameter={parameter}
                    current={current}
                  />

                )}

              </aside>

            </section>


            <section className="bottom-grid">

              <div className="parameter-panel">

                <div className="panel-heading">

                  <div>

                    <span className="section-kicker">
                      FOCUS LAYER
                    </span>

                    <h2>
                      Weather parameters
                    </h2>

                  </div>

                </div>


                <div className="parameter-tabs">

                  {Object.entries(parameters).map(
                    ([name, item]) => {

                      const Icon = item.icon

                      return (

                        <button
                          key={name}

                          className={
                            parameter === name
                              ? 'selected'
                              : ''
                          }

                          style={{
                            '--accent':
                              item.color
                          }}

                          onClick={() => {

                            setParameter(name)

                            setSelectedStation(null)

                          }}
                        >

                          <Icon size={18} />

                          <span>
                            {name}
                          </span>

                        </button>

                      )

                    }
                  )}

                </div>

              </div>


              <AnomalyCard
                anomaly={
                  criticalAnomalies[
                    criticalIndex %
                    criticalAnomalies.length
                  ]
                }

                onNext={() =>
                  setCriticalIndex(
                    (index) =>
                      (index + 1) %
                      criticalAnomalies.length
                  )
                }
              />

            </section>

          </div>

        )}

      </main>

    </div>
  )
}


// =====================================
// SECONDARY VIEW
// =====================================

function SecondaryView({
  view,
  stations,
  alerts,
  anomalyRows,
  setActiveNav,
  selectStation,
  theme,
  setTheme,
  markAlertRead,
  globeAnimation,
  setGlobeAnimation,
  liveParameter,
  setLiveParameter
}) {

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [alertFilter, setAlertFilter] =
    useState('All')

  const [autoRefresh, setAutoRefresh] =
    useState(true)

  const [notifications, setNotifications] =
    useState(true)

  const [refreshInterval, setRefreshInterval] =
    useState('30 seconds')

  const [tick, setTick] =
    useState(0)


  useEffect(() => {

    if (!autoRefresh)
      return undefined

    const timer = setInterval(() => {

      setTick(
        (currentTick) =>
          currentTick + 1
      )

    }, 30000)

    return () =>
      clearInterval(timer)

  }, [autoRefresh])


  const filteredStations =
    stations.filter((station) => {

      const matchesSearch =
        `${station.id} ${station.city} ${station.region}`
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )

      return (
        matchesSearch &&
        (
          statusFilter === 'All' ||
          station.status === statusFilter
        )
      )

    })


  const filteredAlerts =
    alerts.filter(
      (alert) =>
        alertFilter === 'All' ||
        alert.severity === alertFilter
    )


  if (view === 'Live Data') {

    return (
      <LiveDataView
        tick={tick}
        stations={stations}
        liveParameter={liveParameter}
        setLiveParameter={setLiveParameter}
      />
    )

  }


  if (view === 'Stations') {

    return (
      <StationsView
        stations={filteredStations}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectStation={selectStation}
      />
    )

  }


  if (view === 'Alerts') {

    return (
      <AlertsView
        alerts={filteredAlerts}
        filter={alertFilter}
        setFilter={setAlertFilter}
        openAlert={markAlertRead}
      />
    )

  }


  if (view === 'Anomalies') {

    return (
      <AnomaliesView
        anomalies={anomalyRows}
      />
    )

  }


  if (view === 'Reports') {

    return <ReportsView />

  }


  if (view === 'System Health') {

    return <HealthView />

  }


  if (view === 'Settings') {

    return (

      <SettingsView
        theme={theme}
        setTheme={setTheme}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        notifications={notifications}
        setNotifications={setNotifications}
        globeAnimation={globeAnimation}
        setGlobeAnimation={setGlobeAnimation}
      />

    )

  }


  return (
    <AboutView
      setActiveNav={setActiveNav}
    />
  )
}


// =====================================
// LIVE DATA VIEW
// =====================================

function LiveDataView({
  stations,
  tick,
  liveParameter,
  setLiveParameter
}) {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="LIVE TELEMETRY"
        title="Live data"
      />


      <div className="live-grid">

        {stations.map(
          (station) => (

            <div
              className="live-card"
              key={station.id}
            >

              <div className="live-card-top">

                <div>

                  <strong>
                    {station.id}
                  </strong>

                  <span>

                    {station.city},
                    {' '}
                    {station.region}

                  </span>

                </div>

                <StatusPill
                  status={station.status}
                />

              </div>


              <div className="live-parameter-grid">

                {[
                  'Temperature',
                  'Humidity',
                  'Wind',
                  'Rainfall',
                  'Pressure'
                ].map((name) => (

                  <button
                    type="button"
                    className="live-parameter-card"
                    key={name}

                    onClick={() =>
                      setLiveParameter({
                        name,
                        station
                      })
                    }
                  >

                    <span>
                      {name}
                    </span>

                    <strong>

                      {stationValue(
                        station,
                        name,
                        tick
                      )}

                    </strong>

                    <em>
                      {parameterUnit(name)}
                    </em>

                  </button>

                ))}

              </div>

            </div>

          )
        )}

      </div>


      {liveParameter && (

        <ParameterModal
          parameter={
            liveParameter.name
          }

          station={
            liveParameter.station
          }

          onClose={() =>
            setLiveParameter(null)
          }
        />

      )}

    </div>
  )
}


// =====================================
// STATION VALUE
// =====================================

function stationValue(
  station,
  name,
  tick
) {

  const value =
    name === 'Temperature'
      ? station.temp +
        (tick % 2 ? 0.1 : 0)
      : name === 'Humidity'
        ? station.humidity
        : name === 'Wind'
          ? station.wind
          : name === 'Rainfall'
            ? station.rainfall
            : station.pressure

  return name === 'Temperature'
    ? Number(value).toFixed(1)
    : value
}


function parameterUnit(name) {

  if (name === 'Temperature')
    return '°C'

  if (name === 'Humidity')
    return '%'

  if (name === 'Wind')
    return 'km/h'

  if (name === 'Rainfall')
    return 'mm'

  return 'hPa'
}


// =====================================
// VIEW HEADER
// =====================================

function ViewHeader({
  eyebrow,
  title,
  action
}) {

  return (

    <div className="view-header">

      <div>

        <span className="section-kicker">
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

      </div>

      {action}

    </div>
  )
}


// =====================================
// NOTIFICATION PANEL
// =====================================

function NotificationPanel({
  alerts: notificationAlerts,
  unreadAlerts,
  markAlertRead,
  markAllRead
}) {

  return (

    <div
      className="notification-panel"
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      <div className="notification-head">

        <div>

          <span className="section-kicker">
            ALERT STREAM
          </span>

          <h2>

            Notifications

            <b>
              {unreadAlerts.length}
            </b>

          </h2>

        </div>

        <button onClick={markAllRead}>
          Mark all read
        </button>

      </div>


      {notificationAlerts.length > 0 ? (

        notificationAlerts.map(
          (alert) => (

            <button
              className={`notification-item ${
                unreadAlerts.includes(
                  `${alert.station}-${alert.type}`
                )
                  ? 'unread'
                  : ''
              }`}

              key={
                alert.station +
                alert.type
              }

              onClick={() =>
                markAlertRead(alert)
              }
            >

              <div>

                <strong>

                  {alert.station}
                  {' · '}
                  {alert.type}

                </strong>

                <span>

                  Risk score {alert.risk}
                  {' · '}
                  {alert.time}

                </span>

              </div>

              <ArrowUpRight size={13} />

            </button>

          )
        )

      ) : (

        <div className="table-empty">
          No active alerts
        </div>

      )}

    </div>
  )
}


// =====================================
// STATIONS VIEW
// =====================================

function StationsView({
  stations,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectStation
}) {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="NETWORK DIRECTORY"
        title="Stations"
      />


      <div className="station-tools">

        <input
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search station"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >

          <option>All</option>
          <option>Healthy</option>
          <option>Warning</option>
          <option>High Risk</option>
          <option>Critical</option>

        </select>

      </div>


      <div className="data-table stations-table">

        <div className="table-row table-header">

          <span>Station ID</span>
          <span>Location</span>
          <span>Temperature</span>
          <span>Humidity</span>
          <span>Wind</span>
          <span>Rainfall</span>
          <span>Pressure</span>
          <span>Status</span>
          <span>Risk</span>

        </div>


        {stations.length > 0 ? (

          stations.map(
            (station) => (

              <button
                className="table-row table-data"
                key={station.id}

                onClick={() =>
                  selectStation(station)
                }
              >

                <span>
                  <strong>
                    {station.id}
                  </strong>
                </span>

                <span>

                  {station.city},
                  {' '}
                  {station.region}

                </span>

                <span>
                  {station.temp}°C
                </span>

                <span>
                  {station.humidity}%
                </span>

                <span>
                  {station.wind} km/h
                </span>

                <span>
                  {station.rainfall} mm
                </span>

                <span>
                  {station.pressure} hPa
                </span>

                <span>
                  <StatusPill
                    status={station.status}
                  />
                </span>

                <span>
                  {station.risk}/100
                </span>

              </button>

            )
          )

        ) : (

          <div className="table-empty">
            No stations found
          </div>

        )}

      </div>

    </div>
  )
}


// =====================================
// ALERTS VIEW
// =====================================

function AlertsView({
  alerts,
  filter,
  setFilter,
  openAlert
}) {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="ALERT CENTER"
        title="Alerts"
      />


      <div className="filter-tabs">

        {[
          'All',
          'Critical',
          'High Risk',
          'Warning'
        ].map((item) => (

          <button
            key={item}

            className={
              filter === item
                ? 'active'
                : ''
            }

            onClick={() =>
              setFilter(item)
            }
          >

            {item}

          </button>

        ))}

      </div>


      <div className="data-table alerts-table">

        <div className="table-row table-header">

          <span>Station ID</span>
          <span>Alert Type</span>
          <span>Description</span>
          <span>Severity</span>
          <span>Risk Score</span>
          <span>Time</span>

        </div>


        {alerts.length > 0 ? (

          alerts.map(
            (alert) => (

              <button
                className="table-row table-data"

                key={
                  `${alert.station}-${alert.type}`
                }

                onClick={() =>
                  openAlert(alert)
                }
              >

                <span>
                  <strong>
                    {alert.station}
                  </strong>
                </span>

                <span>
                  {alert.type}
                </span>

                <span className="alert-description">
                  {alert.description}
                </span>

                <span>

                  <StatusPill
                    status={
                      alert.severity
                    }
                  />

                </span>

                <span>

                  <strong>
                    {alert.risk}/100
                  </strong>

                </span>

                <span>
                  {alert.time}
                </span>

              </button>

            )
          )

        ) : (

          <div className="table-empty">
            No active alerts
          </div>

        )}

      </div>

    </div>
  )
}


// =====================================
// ANOMALIES VIEW
// =====================================

function AnomaliesView({
  anomalies
}) {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="AI DETECTION PIPELINE"
        title="Anomalies"
      />


      <div className="data-table anomalies-table">

        <div className="table-row table-header">

         <span>Station</span>
<span>Type</span>
<span>Parameter</span>
<span>Detected Value</span>
<span>Expected Value</span>
<span>Risk Score</span>
<span>Severity</span>
<span>Explanation</span>

        </div>


        {anomalies.length > 0 ? (

          anomalies.map(
            (anomaly, index) => (

              <div
                className="table-row table-data"

                key={
                  `${anomaly.station}-${anomaly.type}-${index}`
                }
              >

                <span>
                  <strong>
                    {anomaly.station}
                  </strong>
                </span>

                <span>
                  {anomaly.type}
                </span>

                <span>
                  {anomaly.parameter}
                </span>

                <span>
                  {anomaly.value}
                </span>

                <span>
                  {anomaly.expected}
                </span>

                <span>
                  {anomaly.risk}/100
                </span>

                <span>

                  <StatusPill
                    status={
                      anomaly.severity
                    }
                  />

                </span>

              </div>

            )
          )

        ) : (

          <div className="table-empty">
            No anomalies detected
          </div>

        )}

      </div>

    </div>
  )
}


// =====================================
// REPORTS
// =====================================

function ReportsView() {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="OPERATIONAL REPORTING"
        title="Reports"
      />

      <div className="report-grid">

        <StatCard
          label="Stations monitored"
          value="250"
          tone="cyan"
          icon={Globe2}
        />

        <StatCard
          label="Total anomalies"
          value="12"
          tone="red"
          icon={Zap}
        />

      </div>

    </div>
  )
}


// =====================================
// HEALTH
// =====================================

function HealthView() {

  const services = [
    ['API connection', 'Online', 'green', Server],
    ['Database', 'Online', 'green', Database],
    ['Data ingestion', 'Online', 'green', RefreshCw],
    ['Anomaly engine', 'Active', 'green', Zap],
    ['Rule engine', 'Active', 'yellow', SlidersHorizontal]
  ]


  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="INFRASTRUCTURE TELEMETRY"
        title="System health"
      />

      <div className="service-list">

        {services.map(
          ([name, state, tone, Icon]) => (

            <div
              className="service-row"
              key={name}
            >

              <div
                className={`service-icon ${tone}`}
              >

                <Icon size={17} />

              </div>

              <div>

                <strong>
                  {name}
                </strong>

                <span>
                  Operational monitoring service
                </span>

              </div>

              <b className={tone}>
                {state}
              </b>

            </div>

          )
        )}

      </div>

    </div>
  )
}


// =====================================
// SETTINGS
// =====================================

function SettingsView({
  theme,
  setTheme,
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  setRefreshInterval,
  notifications,
  setNotifications,
  globeAnimation,
  setGlobeAnimation
}) {

  return (

    <div className="secondary-view">

      <ViewHeader
        eyebrow="OPERATOR PREFERENCES"
        title="Settings"
      />

      <div className="settings-panel">

        <SettingToggle
          label="Light theme"
          checked={
            theme === 'light'
          }

          onChange={() =>
            setTheme(
              theme === 'light'
                ? 'dark'
                : 'light'
            )
          }
        />

        <SettingToggle
          label="Auto-refresh"
          checked={autoRefresh}

          onChange={() =>
            setAutoRefresh(
              !autoRefresh
            )
          }
        />


        <div className="setting-row">

          <strong>
            Refresh interval
          </strong>

          <select
            value={refreshInterval}

            onChange={(event) =>
              setRefreshInterval(
                event.target.value
              )
            }
          >

            <option>15 seconds</option>
            <option>30 seconds</option>
            <option>1 minute</option>
            <option>5 minutes</option>

          </select>

        </div>


        <SettingToggle
          label="Alert notifications"
          checked={notifications}

          onChange={() =>
            setNotifications(
              !notifications
            )
          }
        />

        <SettingToggle
          label="Map animation"
          checked={globeAnimation}

          onChange={() =>
            setGlobeAnimation(
              !globeAnimation
            )
          }
        />

      </div>

    </div>
  )
}


// =====================================
// SETTING TOGGLE
// =====================================

function SettingToggle({
  label,
  checked,
  onChange
}) {

  return (

    <div className="setting-row">

      <strong>
        {label}
      </strong>

      <button
        className={`toggle ${
          checked ? 'on' : ''
        }`}

        onClick={onChange}
      >

        <i />

      </button>

    </div>
  )
}


// =====================================
// ABOUT
// =====================================

function AboutView({
  setActiveNav
}) {

  return (

    <div className="secondary-view about-view">

      <ViewHeader
        eyebrow="ATMOS AI · SYSTEM BRIEF"
        title="About"
      />

      <div className="about-panel">

        <div className="about-symbol">
          <Activity size={28} />
        </div>

        <div className="about-copy">

          <h2>
            AI-Based Automatic Weather Station
            Anomaly Detection System
          </h2>

          <p>
            Automatic Weather Stations continuously
            collect temperature, humidity, wind,
            rainfall, and pressure observations.
          </p>

          <button
            className="primary-action"

            onClick={() =>
              setActiveNav(
                'Dashboard'
              )
            }
          >

            Open command center

          </button>

        </div>

      </div>

    </div>
  )
}


// =====================================
// OVERVIEW PANEL
// =====================================

function OverviewPanel({
  parameter,
  current
}) {

  const Icon = current.icon

  return (

    <div className="panel-content">

      <div className="panel-heading">

        <div>

          <span className="section-kicker">
            PARAMETER OVERVIEW
          </span>

          <h2>

            <Icon
              size={19}
              style={{
                color: current.color
              }}
            />

            {parameter}

          </h2>

        </div>

      </div>


      <div className="overview-value">

        <div>

          <span>
            Current average
          </span>

          <strong>

            {current.value}

            <em>
              {current.unit}
            </em>

          </strong>

        </div>

      </div>


      <MiniChart
        data={current.chart}
        color={current.color}
      />


      <div className="insight-box">

        <div className="insight-icon">
          <Zap size={15} />
        </div>

        <div>

          <span>
            AI SIGNAL
          </span>

          <p>
            {current.insight}
          </p>

        </div>

      </div>

    </div>
  )
}


// =====================================
// STATION PANEL
// =====================================

function StationPanel({
  station,
  parameter,
  onClose
}) {

  return (

    <div className="panel-content station-detail">

      <div className="panel-heading">

        <div>

          <span className="section-kicker">

            STATION INSPECTION ·
            {' '}
            {parameter.toUpperCase()}

          </span>

          <h2>
            {station.id}
          </h2>

        </div>

        <button
          className="close-button"
          onClick={onClose}
        >

          <X size={16} />

        </button>

      </div>


      <div className="station-location">

        <Globe2 size={15} />

        {station.city},
        {' '}
        {station.region}

        <StatusPill
          status={station.status}
        />

      </div>


      <div className="station-risk">

        <span>
          Risk score
        </span>

        <strong>
          {station.risk}/100
        </strong>

      </div>


      <div className="station-readings">

        <Reading
          label="Temperature"
          value={`${station.temp}°C`}
          icon={Thermometer}
        />

        <Reading
          label="Humidity"
          value={`${station.humidity}%`}
          icon={CloudSun}
        />

        <Reading
          label="Pressure"
          value={`${station.pressure} hPa`}
          icon={Gauge}
        />

        <Reading
          label="Wind speed"
          value={`${station.wind} km/h`}
          icon={Wind}
        />

        <Reading
          label="Rainfall"
          value={`${station.rainfall} mm`}
          icon={CloudRain}
        />

      </div>

    </div>
  )
}


// =====================================
// READING
// =====================================

function Reading({
  label,
  value,
  icon: Icon
}) {

  return (

    <div className="reading">

      <Icon size={15} />

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  )
}


// =====================================
// ANOMALY CARD
// =====================================

function AnomalyCard({
  anomaly,
  onNext
}) {

  return (

    <div className="anomaly-card">

      <div className="anomaly-card-head">

        <div>

          <span className="section-kicker">

            {String(
              anomaly.severity
            ).toUpperCase()}

            {' '}
            ANOMALY

          </span>

          <h2>
            {anomaly.type}
          </h2>

        </div>

        <span>
          {anomaly.time}
        </span>

      </div>


      <div className="anomaly-card-body">

        <div>

          <strong>
            {anomaly.station}
          </strong>

          <span>
            {anomaly.city}
          </span>

        </div>


        <div>

          <strong>
            {anomaly.value}
          </strong>

          <span>
            {anomaly.parameter}
          </span>

        </div>


        <div>

          <span>
            Expected range
          </span>

          <strong>
            {anomaly.expected}
          </strong>

        </div>


        <div>

          <span>
            Risk score
          </span>

          <strong>
            {anomaly.risk}/100
          </strong>

        </div>

      </div>


      <div className="anomaly-card-foot">

        <span>

          AI classified ·
          {' '}
          {anomaly.type}

        </span>

        <button
          onClick={onNext}
        >

          Next anomaly ↗

        </button>

      </div>

    </div>
  )
}


// =====================================
// PARAMETER MODAL
// =====================================

function ParameterModal({
  parameter,
  station,
  onClose
}) {

  const value =
    parameter === 'Temperature'
      ? station.temp
      : parameter === 'Humidity'
        ? station.humidity
        : parameter === 'Wind'
          ? station.wind
          : parameter === 'Rainfall'
            ? station.rainfall
            : station.pressure

  return (

    <div
      className="parameter-modal-backdrop"
      onClick={onClose}
    >

      <div
        className="parameter-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <button
          className="close-button"
          onClick={onClose}
        >

          <X size={18} />

        </button>

        <span className="section-kicker">
          LIVE PARAMETER
        </span>

        <h2>
          {parameter}
        </h2>

        <p>
          {station.id} ·
          {' '}
          {station.city}
        </p>

        <strong className="modal-value">

          {value}
          {' '}
          {parameterUnit(parameter)}

        </strong>

        <StatusPill
          status={station.status}
        />

      </div>

    </div>
  )
}


// =====================================
// RENDER
// =====================================

createRoot(
  document.getElementById('root')
).render(<App />)