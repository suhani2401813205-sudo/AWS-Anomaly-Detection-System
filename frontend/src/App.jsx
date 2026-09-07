import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'

import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  Globe2,
  Menu,
  Search,
  X,
  Zap
} from 'lucide-react'

import './styles.css'

import { fallbackStations } from './data/mockStations'
import { deriveStatus, getAnomalyType, getExplanation } from './utils/helpers'
import { parameters, navItems } from './config/constants'
import { StatCard } from './components/Shared'
import { SecondaryView, NotificationPanel, OverviewPanel } from './components/Views'
import { StationDetailsView, AnomalyCard } from './components/StationDetails'


export default function App() {

  const [activeNav, setActiveNav] = useState('Dashboard')
  const [parameter, setParameter] = useState('Temperature')

  const [liveData, setLiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedStationId, setSelectedStationId] = useState(null)
  const [stationSearchTerm, setStationSearchTerm] = useState('')
  const [stationStatusFilter, setStationStatusFilter] = useState('All')
  const [stationHistory, setStationHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [historyParameter, setHistoryParameter] = useState('temperature')
  const [dashboardHistory, setDashboardHistory] = useState([])
  const [dashboardHistoryLoading, setDashboardHistoryLoading] = useState(false)
  const [dashboardHistoryError, setDashboardHistoryError] = useState(null)

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

function normalizeM3(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

function getM3Anomalies(value) {
  return normalizeM3(value).filter(
    (item) => item && item.anomaly
  )
}
  // =====================================
  // CREATE STATIONS FROM LIVE BACKEND DATA
  // =====================================

  const stations = Array.isArray(liveData?.stations) && liveData.stations.length
    ? liveData.stations
        .filter((item) => item && item.station)
        .map((item) => {
          const weather = item.weather_data || {}
          const m2 = item.m2 || {}
          const m3 = normalizeM3(item.m3)
          const m4 = item.m4 || {}
          const firstM3 = getM3Anomalies(m3)[0] || {}
          const status = deriveStatus(m2, firstM3, m4)
          const statusColors = {
            Healthy: '#55d6a3',
            Warning: '#ffc857',
            'High Risk': '#ff9955',
            Critical: '#ff6b5f'
          }
          const risk = Number(m4.risk_score)
          return {
            id: item.station.id,
            city: item.station.city || item.station.name || 'Unknown',
            region: item.station.region || item.station.state || 'Unknown',
            lat: Number(item.station.latitude) || 0,
            lng: Number(item.station.longitude) || 0,
            status,
            color: statusColors[status],
            risk: Number.isFinite(risk) ? Math.round(risk) : 0,
            temp: weather.temperature ?? '—',
            humidity: weather.humidity ?? '—',
            pressure: weather.pressure ?? '—',
            wind: weather.wind_speed ?? '—',
            rainfall: weather.rainfall ?? '—',
            updated: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now',
            m2,
            m3,
            m4,
            metadata: item.station,
            weatherData: weather,
            sensorHealth: m4.sensor_health ?? 100,
            severity: m4.severity || status,
            anomalyType: getAnomalyType(m2, firstM3, m4),
            explanation: getExplanation(m4, firstM3, m2)
          }
        })
    : fallbackStations


  // =====================================
  // ANOMALIES
  // =====================================


// =====================================
// ANOMALIES
// =====================================

const anomalyRows = stations.flatMap((station) => {

  const m3Anomalies = getM3Anomalies(station.m3)

  const mlStatus = String(
    station.m2?.ml_status ??
    station.m2?.status ??
    ''
  ).toLowerCase()

  const m2IsAnomaly =
    mlStatus.includes('anomaly')


  if (m3Anomalies.length) {

    return m3Anomalies.map((result, resultIndex) => {

      /* ---------------------------------
         PARAMETER
      --------------------------------- */

      let parameter =
        result?.feature ?? 'Weather parameter'


      if (Array.isArray(parameter)) {
        parameter = parameter
          .map((item) =>
            String(item)
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c =>
                c.toUpperCase()
              )
          )
          .join(', ')
      }


      /* ---------------------------------
         DETECTED VALUE
      --------------------------------- */

      let detectedValue =
        result?.value ?? '—'


      /*
       * If backend provides details[],
       * use the actual parameter-wise values.
       */

      if (
        Array.isArray(result?.details) &&
        result.details.length
      ) {

        detectedValue = result.details
          .map((detail) => {

            const feature =
              detail?.feature

            const value =
              detail?.value

            if (!feature) {
              return null
            }

            const label =
              String(feature)
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c =>
                  c.toUpperCase()
                )

            return `${label}: ${value ?? '—'}`

          })
          .filter(Boolean)
          .join(' • ')

      }


      /* ---------------------------------
         EXPECTED VALUE
      --------------------------------- */

      let expectedValue =
        result?.expected_value


      if (!expectedValue) {

        const anomalyType =
          String(
            result?.anomaly_type || ''
          ).toUpperCase()

        if (
          anomalyType === 'FROZEN_VALUE'
        ) {
          expectedValue =
            'Variable reading'
        }
        else if (
          anomalyType === 'SPIKE'
        ) {
          expectedValue =
            'Within normal variation'
        }
        else if (
          anomalyType === 'DRIFT'
        ) {
          expectedValue =
            'Stable baseline'
        }
        else if (
          anomalyType === 'MISSING_DATA'
        ) {
          expectedValue =
            'Value required'
        }
        else {
          expectedValue =
            'Normal range'
        }
      }


      /* ---------------------------------
         ACTUAL ANOMALY STATUS
      --------------------------------- */

      const hasM3Anomaly =
        Boolean(result?.anomaly)

      const isAnomaly =
        hasM3Anomaly ||
        m2IsAnomaly


      /*
       * IMPORTANT:
       * Status should NOT come only from M2.
       *
       * M3 anomaly = ANOMALY
       */

      const displayStatus =
        isAnomaly
          ? 'ANOMALY'
          : 'NORMAL'


      /* ---------------------------------
         SEVERITY
      --------------------------------- */

      const risk =
        Number(
          station.m4?.risk_score ?? 0
        )


      const severity =
        station.m4?.severity ??
        station.status ??
        (
          risk >= 85
            ? 'Critical'
            : risk >= 65
            ? 'High Risk'
            : risk >= 35
            ? 'Warning'
            : 'Healthy'
        )


      /* ---------------------------------
         CONFIDENCE
      --------------------------------- */

      const rawConfidence =
        Number(
          station.m4?.confidence
        )

      const confidence =
        Number.isFinite(rawConfidence)
          ? `${Math.round(
              rawConfidence * 100
            )}%`
          : '—'


      /* ---------------------------------
         TIMESTAMP
      --------------------------------- */

      const timestamp =
        result?.timestamp ||
        station.updated


      /* ---------------------------------
         EXPLANATION
      --------------------------------- */

      const explanation =
        station.m4?.explanation ||
        result?.reason ||
        'Weather anomaly detected.'


      return {

        station:
          station.id,

        city:
          station.city,

        type:
          result?.anomaly_type ||
          'Weather Anomaly',

        parameter,

        value:
          detectedValue,

        expected:
          expectedValue,

        risk,

        confidence,

        severity,

        status:
          displayStatus,

        time:
          timestamp,

        description:
          explanation,

        source:
          'M3',

        key:
          `${station.id}-${result?.anomaly_type || 'anomaly'}-${resultIndex}`

      }

    })

  }


  /* =====================================
     M2 ONLY ANOMALY
  ===================================== */

  if (m2IsAnomaly) {

    const parameter =
      station.m2?.parameter ||
      'Weather parameter'


    const detectedValue =
      station.m2?.detected_value ??
      station.weatherData?.[
        parameter
      ] ??
      '—'


    const risk =
      Number(
        station.m4?.risk_score ?? 0
      )


    const severity =
      station.m4?.severity ??
      station.status ??
      'Warning'


    return [{

      station:
        station.id,

      city:
        station.city,

      type:
        station.m2?.anomaly_type ??
        'ML Anomaly',

      parameter,

      value:
        detectedValue,

      expected:
        station.m2?.expected_value ??
        'Normal range',

      risk,

      confidence:
        Number.isFinite(
          Number(
            station.m4?.confidence
          )
        )
          ? `${Math.round(
              Number(
                station.m4.confidence
              ) * 100
            )}%`
          : '—',

      severity,

      status:
        'ANOMALY',

      time:
        station.updated,

      description:
        station.m4?.explanation ||
        station.m2?.reason ||
        'Unusual weather pattern detected.',

      source:
        'M2',

      key:
        `${station.id}-m2`

    }]

  }


  return []

})

  // =====================================
  // ALERTS
  // =====================================

  const alerts = stations
    .filter((station) => {
      const mlStatus = String(station.m2?.ml_status ?? station.m2?.status ?? '').toLowerCase()
      const m3Anomaly = getM3Anomalies(station.m3).length > 0
      return (
        mlStatus.includes('anomaly') ||
        m3Anomaly ||
        station.status === 'Warning' ||
        station.status === 'High Risk' ||
        station.status === 'Critical'
      )
    })
    .map((station) => ({
      station: station.id,
      type: station.anomalyType,
      severity: station.status,
      risk: station.risk,
      time: station.updated,
      description: station.explanation,
      anomalyType: station.anomalyType
    }))



  // =====================================
  // CRITICAL ANOMALY CARD
  // =====================================

  const criticalAnomalies =
    anomalyRows.length > 0
      ? anomalyRows
      : []


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

  const selectedStation = stations.find(
    (station) => station.id === selectedStationId
  )


  useEffect(() => {

    const handlePopState = () => {
      setSelectedStationId(null)
      setActiveNav('Stations')
      setAutoRotate(true)
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])


  useEffect(() => {

    if (!selectedStationId) {
      setStationHistory([])
      setHistoryError(null)
      setHistoryParameter('temperature')
      return undefined
    }

    const controller = new AbortController()

    const fetchStationHistory = async () => {

      try {
        setHistoryLoading(true)
        setHistoryError(null)

        const response = await fetch(
          `http://127.0.0.1:8000/history/${encodeURIComponent(selectedStationId)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch station history: ${response.status}`)
        }

        const data = await response.json()
        setStationHistory(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        setStationHistory([])
        setHistoryError(err.message)
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchStationHistory()

    return () => controller.abort()
  }, [selectedStationId])


  useEffect(() => {

    const stationId = stations[0]?.id

    if (activeNav !== 'Dashboard' || selectedStationId || !stationId) {
      return undefined
    }

    const controller = new AbortController()

    const fetchDashboardHistory = async () => {
      try {
        setDashboardHistoryLoading(true)
        setDashboardHistoryError(null)

        const response = await fetch(
          `http://127.0.0.1:8000/history/${encodeURIComponent(stationId)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard history: ${response.status}`)
        }

        const data = await response.json()
        setDashboardHistory(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        if (err.name === 'AbortError') return
        setDashboardHistory([])
        setDashboardHistoryError(err.message)
      } finally {
        setDashboardHistoryLoading(false)
      }
    }

    fetchDashboardHistory()

    return () => controller.abort()
  }, [activeNav, selectedStationId, stations[0]?.id])


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

    setSelectedStationId(station.id)
    window.history.pushState({ stationId: station.id }, '', window.location.href)

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

              AWS WEATHER NETWORK

            </div>

            <h1>

              {activeNav === 'Dashboard'
                ? 'Command center'
                : activeNav}

            </h1>

          </div>

          <div className="top-actions">

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


        {selectedStation ? (

          <StationDetailsView
            station={selectedStation}
            history={stationHistory}
            historyLoading={historyLoading}
            historyError={historyError}
            historyParameter={historyParameter}
            setHistoryParameter={setHistoryParameter}
            onBack={() => {
              if (window.history.state?.stationId) {
                window.history.back()
              } else {
                setSelectedStationId(null)
                setActiveNav('Stations')
                setAutoRotate(true)
              }
            }}
          />

        ) : activeNav !== 'Dashboard' ? (

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
            stationSearchTerm={stationSearchTerm}
            setStationSearchTerm={setStationSearchTerm}
            stationStatusFilter={stationStatusFilter}
            setStationStatusFilter={setStationStatusFilter}
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

                <OverviewPanel
                  parameter={parameter}
                  current={current}
                  stations={stations}
                  history={dashboardHistory}
                  historyLoading={dashboardHistoryLoading}
                  historyError={dashboardHistoryError}
                />

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

                            setSelectedStationId(null)

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


              {criticalAnomalies.length > 0 && (
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
              )}

            </section>

          </div>

        )}

      </main>

    </div>
  )
}
