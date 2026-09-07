import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Globe from 'react-globe.gl'

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
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
  { id: 'AWS_001', city: 'Pune', region: 'Maharashtra', lat: 18.52, lng: 73.86, status: 'Warning', color: '#ffc857', risk: 62, temp: 31.4, humidity: 68, pressure: 1009, wind: 14, rainfall: 2.4, updated: '2 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 92, severity: 'MEDIUM', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_002', city: 'Mumbai', region: 'Maharashtra', lat: 19.07, lng: 72.87, status: 'Healthy', color: '#55d6a3', risk: 24, temp: 29.8, humidity: 78, pressure: 1011, wind: 19, rainfall: 4.8, updated: '1 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 96, severity: 'LOW', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_003', city: 'Nashik', region: 'Maharashtra', lat: 20.01, lng: 73.78, status: 'Critical', color: '#ff6b5f', risk: 92, temp: 39.6, humidity: 42, pressure: 997, wind: 31, rainfall: 0, updated: '4 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 61, severity: 'CRITICAL', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_004', city: 'Delhi', region: 'NCT Delhi', lat: 28.61, lng: 77.21, status: 'High Risk', color: '#ff9955', risk: 74, temp: 35.2, humidity: 54, pressure: 1004, wind: 22, rainfall: 0.8, updated: '3 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 76, severity: 'VERY HIGH', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_005', city: 'Bengaluru', region: 'Karnataka', lat: 12.97, lng: 77.59, status: 'Healthy', color: '#55d6a3', risk: 18, temp: 24.7, humidity: 74, pressure: 1014, wind: 11, rainfall: 6.2, updated: '1 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 98, severity: 'LOW', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_006', city: 'Kolkata', region: 'West Bengal', lat: 22.57, lng: 88.36, status: 'Warning', color: '#ffc857', risk: 58, temp: 30.9, humidity: 81, pressure: 1008, wind: 17, rainfall: 8.9, updated: '5 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 88, severity: 'MEDIUM', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_007', city: 'Jaipur', region: 'Rajasthan', lat: 26.91, lng: 75.78, status: 'Healthy', color: '#55d6a3', risk: 27, temp: 37.1, humidity: 31, pressure: 1002, wind: 26, rainfall: 0, updated: '2 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 94, severity: 'LOW', explanation: 'Fallback demonstration station.' }
]

const fallbackStations = mockStations.map((station) => ({
  ...station,
  metadata: {
    latitude: station.lat,
    longitude: station.lng,
  },
  weatherData: {
    temperature: station.temp,
    humidity: station.humidity,
    pressure: station.pressure,
    wind_speed: station.wind,
    rainfall: station.rainfall,
  },
}))

function normalizeM3(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}


/* =========================================================
   GET ALL ANOMALY DETAILS
   ========================================================= */

function getAnomalyDetails(station) {
  const m3 =
    station?.m3 ||
    station?.prediction?.m3 ||
    {};

  /* Backend details[] has the actual
     parameter-wise values */

  if (
    Array.isArray(m3?.details) &&
    m3.details.length > 0
  ) {
    return m3.details.filter(
      (item) => item?.anomaly
    );
  }

  /* Fallback if details[] is not available */

  const items = normalizeM3(m3);

  return items.filter(
    (item) => item?.anomaly
  );
}


/* =========================================================
   FORMAT PARAMETERS
   ========================================================= */

function getParameters(station) {
  const details = getAnomalyDetails(station);

  const parameters = [];

  details.forEach((item) => {

    let feature = item?.feature;

    if (Array.isArray(feature)) {
      feature.forEach((f) => {
        if (f && !parameters.includes(f)) {
          parameters.push(f);
        }
      });
    } else if (
      feature &&
      !parameters.includes(feature)
    ) {
      parameters.push(feature);
    }

  });

  return parameters;
}


/* =========================================================
   GET DETECTED VALUES
   ========================================================= */

function getDetectedValues(station) {
  const details = getAnomalyDetails(station);

  if (!details.length) {
    return "—";
  }

  const values = [];

  details.forEach((item) => {

    const feature = item?.feature;
    const value = item?.value;

    if (
      Array.isArray(feature) &&
      Array.isArray(value)
    ) {
      feature.forEach((f, index) => {
        values.push(
          `${formatFeatureName(f)}: ${
            value[index] ?? "—"
          }`
        );
      });

      return;
    }

    if (Array.isArray(feature)) {
      feature.forEach((f) => {
        values.push(
          `${formatFeatureName(f)}: ${
            value ?? "—"
          }`
        );
      });

      return;
    }

    if (feature) {
      values.push(
        `${formatFeatureName(feature)}: ${
          value ?? "—"
        }`
      );
    }
  });

  return values.length
    ? values.join(" • ")
    : "—";
}


/* =========================================================
   FEATURE NAME
   ========================================================= */

function formatFeatureName(feature) {

  const names = {
    temperature: "Temperature",
    humidity: "Humidity",
    pressure: "Pressure",
    wind_speed: "Wind Speed",
    rainfall: "Rainfall",
    timestamp: "Timestamp",
  };

  return (
    names[feature] ||
    String(feature || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) =>
        c.toUpperCase()
      )
  );
}


/* =========================================================
   EXPECTED VALUE
   ========================================================= */

function getExpectedValue(station) {

  const details = getAnomalyDetails(station);

  if (!details.length) {
    return "—";
  }

  const types = [
    ...new Set(
      details
        .map(
          (item) =>
            item?.anomaly_type
        )
        .filter(Boolean)
    ),
  ];

  if (
    types.includes("FROZEN_VALUE")
  ) {
    return "Variable reading";
  }

  if (
    types.includes("SPIKE")
  ) {
    return "Within normal variation";
  }

  if (
    types.includes("DRIFT")
  ) {
    return "Stable baseline";
  }

  if (
    types.includes("MISSING_DATA")
  ) {
    return "Value required";
  }

  return "—";
}


/* =========================================================
   GET ANOMALY TYPE
   ========================================================= */

function getTableAnomalyType(station) {

  const details =
    getAnomalyDetails(station);

  const types = [
    ...new Set(
      details
        .map(
          (item) =>
            item?.anomaly_type
        )
        .filter(
          (type) =>
            type &&
            type !== "NORMAL"
        )
    ),
  ];

  return types.length
    ? types.join(", ")
    : "NORMAL";
}


/* =========================================================
   GET EXPLANATION
   ========================================================= */

function getAnomalyExplanation(station) {

  const details =
    getAnomalyDetails(station);

  if (details.length) {

    const reasons = details
      .map(
        (item) =>
          item?.reason
      )
      .filter(Boolean);

    if (reasons.length) {
      return reasons.join(" | ");
    }
  }

  return (
    station?.m4?.explanation ||
    "No anomaly detected."
  );
}


/* =========================================================
   GET TIMESTAMP
   ========================================================= */

function getAnomalyTimestamp(station) {

  const details =
    getAnomalyDetails(station);

  const timestamp =
    details.find(
      (item) =>
        item?.timestamp
    )?.timestamp ||
    station?.timestamp;

  return timestamp;
}



function getDetectedParameter(station, anomaly = {}) {
  if (anomaly?.feature) {
    return anomaly.feature
  }

  if (station?.m2?.parameter) {
    return station.m2.parameter
  }

  const type = String(
    anomaly?.anomaly_type ??
    station?.m2?.anomaly_type ??
    ''
  ).toLowerCase()

  if (type.includes('rain')) return 'rainfall'
  if (type.includes('humidity')) return 'humidity'
  if (type.includes('wind')) return 'wind_speed'
  if (type.includes('pressure')) return 'pressure'
  if (type.includes('temperature')) return 'temperature'

  return 'Weather parameter'
}



function getAnomalyType(m2, m3, m4) {
  return m4?.anomaly_type || m3?.anomaly_type || m2?.anomaly_type || 'Weather Anomaly'
}

function getExplanation(m4, m3, m2) {
  return m4?.explanation || m3?.reason || m3?.explanation || m2?.reason || 'Weather anomaly detected.'
}

function deriveStatus(m2, m3, m4) {
  const severity = String(m4?.severity ?? '').toUpperCase().trim()
  const mlStatus = String(m2?.ml_status ?? m2?.status ?? '').toLowerCase()
  const m3Anomaly = Boolean(m3?.anomaly)

  if (severity === 'CRITICAL') return 'Critical'
  if (severity === 'VERY HIGH') return 'High Risk'
  if (severity === 'HIGH') return 'High Risk'
  if (severity === 'MEDIUM') return 'Warning'
  if (severity === 'LOW' && (mlStatus.includes('anomaly') || m3Anomaly)) return 'Warning'
  if (mlStatus.includes('anomaly') || m3Anomaly) return 'Warning'
  if (severity === 'LOW') return 'Healthy'

  const risk = Number(m4?.risk_score)
  if (Number.isFinite(risk)) {
    if (risk >= 85) return 'Critical'
    if (risk >= 65) return 'High Risk'
    if (risk >= 35) return 'Warning'
  }
  return 'Healthy'
}

// =====================================
// PARAMETERS
// =====================================

const parameters = {
  Temperature: {
    icon: Thermometer,
    unit: '°C',
    label: 'Temperature over time',
    color: '#ff9e70'
  },

  Humidity: {
    icon: CloudSun,
    unit: '%',
    label: 'Humidity over time',
    color: '#72c9e8'
  },

  Wind: {
    icon: Wind,
    unit: 'km/h',
    label: 'Wind speed over time',
    color: '#b49cff'
  },

  Rainfall: {
    icon: CloudRain,
    unit: 'mm',
    label: 'Rainfall over time',
    color: '#5ed9c3'
  },

  Pressure: {
    icon: Gauge,
    unit: 'hPa',
    label: 'Atmospheric pressure over time',
    color: '#e6bf69'
  }
}


const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Live Data', Radio],
  ['Stations', Globe2],
  ['Alerts', Bell],
  ['Anomalies', Zap],
  ['System Health', ShieldCheck],
  ['Settings', Settings],
  ['About', CircleHelp]
]


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
  setLiveParameter,
  stationSearchTerm,
  setStationSearchTerm,
  stationStatusFilter,
  setStationStatusFilter
}) {

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
            stationSearchTerm.toLowerCase()
          )

      return (
        matchesSearch &&
        (
          stationStatusFilter === 'All' ||
          station.status === stationStatusFilter
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
        searchTerm={stationSearchTerm}
        setSearchTerm={setStationSearchTerm}
        statusFilter={stationStatusFilter}
        setStatusFilter={setStationStatusFilter}
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

                      {stationValue(station, name)}

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
  name
) {

  const weatherKey = {
    Temperature: 'temperature',
    Humidity: 'humidity',
    Wind: 'wind_speed',
    Rainfall: 'rainfall',
    Pressure: 'pressure'
  }[name]

  const value = station.weatherData?.[weatherKey]

  if (value === undefined || value === null) {
    return value
  }

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
          <span>Location</span>
          <span>Type</span>
          <span>Parameter</span>
          <span>Detected Value</span>
          <span>Expected Value</span>
          <span>Risk Score</span>
          <span>Confidence</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Timestamp</span>
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

                <span>{anomaly.city}</span>

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

                <span>{anomaly.confidence}</span>

                <span>

                  <StatusPill
                    status={
                      anomaly.severity
                    }
                  />

                </span>

                <span>{anomaly.status}</span>

                <span>{anomaly.time}</span>

                <span className="alert-description">{anomaly.description}</span>

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
        eyebrow="AWS ANOMALY DETECTION SYSTEM"
        title="Settings"
      />

      <div className="settings-panel">

        <div className="setting-row">
          <div>
            <strong>Backend API</strong>
            <small>Live data source: /predict/live</small>
          </div>
          <span className="setting-status">Connected through live polling</span>
        </div>

        <div className="setting-row">
          <div>
            <strong>M2 / M3 / M4 pipeline</strong>
            <small>Isolation Forest, rule engine, and M4 risk and health processing</small>
          </div>
          <span className="setting-status">Backend managed</span>
        </div>

        <div className="setting-row">
          <div>
            <strong>Weather monitoring</strong>
            <small>Temperature, humidity, pressure, wind speed, and rainfall</small>
          </div>
          <span className="setting-status">Live station telemetry</span>
        </div>

        <SettingToggle
          label="Light interface theme"
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
  current,
  stations,
  history,
  historyLoading,
  historyError
}) {

  const Icon = current.icon
  const values = stations
    .map((station) => stationValue(station, parameter))
    .filter((value) => value !== undefined && value !== null)
  const average = values.length
    ? values.reduce((total, value) => total + Number(value), 0) / values.length
    : null
  const historyKey = {
    Temperature: 'temperature',
    Humidity: 'humidity',
    Wind: 'wind_speed',
    Rainfall: 'rainfall',
    Pressure: 'pressure'
  }[parameter]

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
            Live average
          </span>

          <strong>

            {average === null ? '—' : average.toFixed(parameter === 'Temperature' || parameter === 'Rainfall' ? 1 : 0)}

            <em>
              {current.unit}
            </em>

          </strong>

        </div>

      </div>


      <div className="insight-box">

        <div className="insight-icon">
          <Zap size={15} />
        </div>

        <div>

          <span>
            AI SIGNAL
          </span>

          <p>
            {stations.length ? `${stations.length} stations reporting live ${parameter.toLowerCase()} data` : 'Waiting for live station data'}
          </p>

        </div>

      </div>

      <div className="dashboard-history-chart">
        <div className="dashboard-history-heading">
          <span className="section-kicker">LIVE HISTORY · API DATA</span>
          <small>{stations[0]?.id}</small>
        </div>
        {historyLoading ? (
          <div className="dashboard-chart-empty">Loading history...</div>
        ) : historyError ? (
          <div className="dashboard-chart-empty">{historyError}</div>
        ) : history.length ? (
          <TrendChart
            title={parameter}
            unit={current.unit}
            history={history}
            valueKey={historyKey}
            group="weather_data"
          />
        ) : (
          <div className="dashboard-chart-empty">No historical data available</div>
        )}
      </div>

    </div>
  )
}


// =====================================
// STATION PANEL
// =====================================

function StationDetailsView({
  station,
  onBack,
  history = [],
}) {

  /* =====================================================
     M2 + M3 CURRENT DETECTION
     ===================================================== */

  const m2 = station?.m2 || {};

  const m3Items = normalizeM3(
    station?.m3 ||
    station?.prediction?.m3
  );

  const m4 =
    station?.m4 ||
    station?.prediction?.m4 ||
    {};

  /* M2 says anomaly */

  const m2Anomaly =
    String(
      m2?.ml_status ??
      m2?.status ??
      ""
    ).toLowerCase() === "anomaly";


  /* M3 says anomaly */

  const m3Anomaly =
    m3Items.some(
      (item) =>
        item?.anomaly === true
    );


  /* Overall current detection */

  const isAnomaly =
    m2Anomaly ||
    m3Anomaly;


  /* =====================================================
     FIRST M3 ANOMALY
     ===================================================== */

  const firstAnomaly =
    m3Items.find(
      (item) =>
        item?.anomaly === true
    );


  /* =====================================================
     ANOMALY TYPE
     ===================================================== */

  const anomalyType =
    firstAnomaly?.anomaly_type ||
    (m2Anomaly
      ? "ML ANOMALY"
      : "NORMAL");


  /* =====================================================
     FEATURE / PARAMETER
     ===================================================== */

  let feature =
    firstAnomaly?.feature ||
    m2?.parameter ||
    "";

  if (Array.isArray(feature)) {
    feature = feature.join(", ");
  }


  /* =====================================================
     DETECTION TYPE
     ===================================================== */

  const detectionType =
    m3Anomaly
      ? "Rule-based pattern detected"
      : m2Anomaly
      ? "Unusual weather pattern"
      : "Normal";


  /* =====================================================
     EXPLANATION
     
     IMPORTANT:
     M3 explanation gets FIRST PRIORITY.
     This prevents M2 generic explanation from
     replacing the actual rule-based explanation.
     ===================================================== */

  const explanation =
    (
      firstAnomaly?.reason &&
      String(firstAnomaly.reason).trim()
    )
      ? String(firstAnomaly.reason).trim()
      : (
          m4?.explanation &&
          String(m4.explanation).trim()
        )
      ? String(m4.explanation).trim()
      : (
          m2?.reason &&
          String(m2.reason).trim()
        )
      ? String(m2.reason).trim()
      : m2Anomaly
      ? (
          m2?.anomaly_score != null
            ? `Isolation Forest detected an unusual weather pattern (anomaly score: ${Number(
                m2.anomaly_score
              ).toFixed(4)}).`
            : "Isolation Forest detected an unusual weather pattern."
        )
      : "Weather readings are normal.";


  /* =====================================================
     RISK SCORE
     ===================================================== */

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Number(
        m4?.risk_score ??
        station?.risk ??
        0
      )
    )
  );


  /* =====================================================
     HEALTH SCORE
     ===================================================== */

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Number(
        m4?.station_health ??
        m4?.sensor_health ??
        station?.stationHealth ??
        station?.sensorHealth ??
        100
      )
    )
  );


  /* =====================================================
     CONFIDENCE
     ===================================================== */

  const rawConfidence =
    Number(
      m4?.confidence ??
      0
    );

  const confidence =
    Math.max(
      0,
      Math.min(
        100,
        rawConfidence <= 1
          ? rawConfidence * 100
          : rawConfidence
      )
    );


  /* =====================================================
     SINGLE STATION STATUS
     ===================================================== */

  const stationStatus =
    riskScore >= 70
      ? "HIGH RISK"
      : riskScore >= 40
      ? "MEDIUM RISK"
      : "NORMAL";


  /* =====================================================
     SEVERITY
     ===================================================== */

  const severity =
    riskScore >= 85
      ? "CRITICAL"
      : riskScore >= 70
      ? "HIGH"
      : riskScore >= 40
      ? "MEDIUM"
      : "LOW";


  /* =====================================================
     SYSTEM ASSESSMENT
     ===================================================== */

  const systemAssessment =
    isAnomaly
      ? explanation
      : "Weather station is operating normally.";


  /* =====================================================
     CLEAR LOG
     ===================================================== */

  const [
    clearedLogs,
    setClearedLogs
  ] = React.useState(false);


  const clearLog = () => {
    setClearedLogs(true);
  };


  /* =====================================================
     LATEST HISTORICAL ALERT
     ===================================================== */

  const allEvents =
    history.flatMap(
      (entry) =>

        normalizeM3(
          entry?.m3
        )
          .filter(
            (event) =>
              event?.anomaly === true
          )
          .map(
            (event) => ({
              ...event,

              timestamp:
                event?.timestamp ||
                entry?.timestamp,

              station_id:
                event?.station_id ||
                entry?.station_id ||
                station?.station_id ||
                station?.id,
            })
          )
    );


  const latestEvent =
    allEvents.length > 0
      ? allEvents[
          allEvents.length - 1
        ]
      : null;


  /* =====================================================
     RENDER
     ===================================================== */

  return (

    <div className="station-details-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <div className="station-details-header">

        <button
          className="station-back-btn"
          onClick={onBack}
        >
          ← Back
        </button>


        <div className="station-title-area">

          <div>

            <span className="section-kicker">
              WEATHER STATION
            </span>


            <h2>
              {station?.station_id ||
                station?.id ||
                "Unknown Station"}
            </h2>


            <p>
              {station?.location ||
                station?.city ||
                "Unknown Location"}
            </p>

          </div>


          {/* CURRENT STATION RISK */}

          <div
            className={`station-status-badge ${
              stationStatus ===
              "HIGH RISK"
                ? "risk-high"
                : stationStatus ===
                  "MEDIUM RISK"
                ? "risk-medium"
                : "risk-normal"
            }`}
          >
            {stationStatus}
          </div>

        </div>

      </div>



      {/* =================================================
          CURRENT CONDITION
          ================================================= */}

      <section className="station-details-card">

        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              CURRENT CONDITION
            </span>

            <h3>
              Live weather readings
            </h3>

          </div>

        </div>


        <div className="station-weather-grid">

          {Object.entries(
            station?.weatherData || {}
          )
            .filter(
              ([key]) =>
                [
                  "temperature",
                  "humidity",
                  "pressure",
                  "wind_speed",
                  "rainfall",
                ].includes(key)
            )
            .map(
              ([key, value]) => (

                <Reading
                  key={key}
                  label={key}
                  value={value}
                />

              )
            )}

        </div>

      </section>



      {/* =================================================
          ANOMALY ANALYSIS
          ================================================= */}

      <section className="station-details-card">

        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              ANOMALY ANALYSIS
            </span>

            <h3>
              Weather condition analysis
            </h3>

          </div>

        </div>


        <div className="anomaly-analysis">


          {/* =============================================
              STATUS + ISSUE
              ============================================= */}

          <div className="analysis-status-row">


            {/* DETECTION STATUS */}

            <div className="analysis-status-box">

              <span>
                Detection Status
              </span>


              <strong
                className={
                  isAnomaly
                    ? "status-danger"
                    : "status-normal"
                }
              >

                {isAnomaly
                  ? "ANOMALY DETECTED"
                  : "NORMAL"}

              </strong>

            </div>



            {/* ISSUE */}

            <div className="analysis-status-box">

              <span>
                Issue
              </span>


              <strong>

                {isAnomaly
                  ? anomalyType
                  : "No anomaly"}

              </strong>

            </div>

          </div>



          {/* =============================================
              ANOMALY DETAILS
              ============================================= */}

          {isAnomaly && (

            <div className="anomaly-detail-grid">


              {/* PARAMETER */}

              <div className="anomaly-detail">

                <span>
                  Parameter
                </span>


                <strong>

                  {feature ||
                    "Weather parameter"}

                </strong>

              </div>



              {/* DETECTION */}

              <div className="anomaly-detail">

                <span>
                  Detection
                </span>


                <strong>

                  {detectionType}

                </strong>

              </div>

            </div>

          )}



          {/* =============================================
              EXPLANATION
              ============================================= */}

          <div className="anomaly-reason">

            <span>
              Explanation
            </span>


            <p>
              {explanation}
            </p>

          </div>

        </div>

      </section>



      {/* =================================================
          RISK & HEALTH
          ================================================= */}

      <section className="station-details-card">

        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              RISK & HEALTH
            </span>

            <h3>
              Station condition
            </h3>

          </div>

        </div>



        <div className="risk-health-summary">


          {/* RISK */}

          <div className="risk-health-item">

            <span>
              Risk Score
            </span>


            <strong>
              {Math.round(
                riskScore
              )}
            </strong>


            <small>
              / 100
            </small>

          </div>



          {/* HEALTH */}

          <div className="risk-health-item">

            <span>
              Health Score
            </span>


            <strong>
              {Math.round(
                healthScore
              )}
            </strong>


            <small>
              / 100
            </small>

          </div>



          {/* SEVERITY */}

          <div className="risk-health-item">

            <span>
              Severity
            </span>


            <strong>
              {severity}
            </strong>

          </div>



          {/* CONFIDENCE */}

          <div className="risk-health-item">

            <span>
              Confidence
            </span>


            <strong>
              {Math.round(
                confidence
              )}%
            </strong>

          </div>

        </div>



        {/* SYSTEM ASSESSMENT */}

        <div className="health-explanation">

          <span>
            System assessment
          </span>


          <p>
            {systemAssessment}
          </p>

        </div>

      </section>



      {/* =================================================
          STATION OVERVIEW BAR GRAPH
          ================================================= */}

      <section className="station-details-card">

        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              STATION OVERVIEW
            </span>


            <h3>
              Risk, health & confidence
            </h3>

          </div>

        </div>



        <div className="station-overview-chart">

          <div className="bar-chart">


            {/* RISK */}

            <div className="bar-item">

              <div className="bar-value">
                {Math.round(
                  riskScore
                )}
              </div>


              <div className="bar-track">

                <div
                  className="bar-fill bar-risk"
                  style={{
                    height:
                      `${riskScore}%`,
                  }}
                />

              </div>


              <span className="bar-label">
                Risk
              </span>

            </div>



            {/* HEALTH */}

            <div className="bar-item">

              <div className="bar-value">
                {Math.round(
                  healthScore
                )}
              </div>


              <div className="bar-track">

                <div
                  className="bar-fill bar-health"
                  style={{
                    height:
                      `${healthScore}%`,
                  }}
                />

              </div>


              <span className="bar-label">
                Health
              </span>

            </div>



            {/* CONFIDENCE */}

            <div className="bar-item">

              <div className="bar-value">
                {Math.round(
                  confidence
                )}
              </div>


              <div className="bar-track">

                <div
                  className="bar-fill bar-confidence"
                  style={{
                    height:
                      `${confidence}%`,
                  }}
                />

              </div>


              <span className="bar-label">
                Confidence
              </span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          RECENT ALERT
          ================================================= */}

      <section className="station-details-card compact-alert-card">


        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              RECENT ALERT
            </span>


            <h3>
              Latest station event
            </h3>

          </div>



          {/* CLEAR LOG */}

          <button
            className="clear-log-btn"
            onClick={clearLog}
          >
            Clear Log
          </button>

        </div>



        {/* LOG CLEARED */}

        {clearedLogs ? (

          <div className="station-history-empty">

            Log cleared successfully.

          </div>

        ) : latestEvent ? (


          /* =============================================
             HISTORICAL EVENT
             ============================================= */

          <div className="station-event compact-event">

            <div className="compact-event-header">

              <strong>
                {latestEvent?.anomaly_type ||
                  "ANOMALY"}
              </strong>


              <span>

                {latestEvent?.timestamp
                  ? new Date(
                      latestEvent.timestamp
                    ).toLocaleString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )
                  : "Recent"}

              </span>

            </div>


            <p>
              {latestEvent?.reason ||
                "Unusual weather reading detected."}
            </p>

          </div>


        ) : isAnomaly ? (


          /* =============================================
             CURRENT ANOMALY IF NO HISTORY
             ============================================= */

          <div className="station-event compact-event">

            <div className="compact-event-header">

              <strong>
                {anomalyType}
              </strong>


              <span>
                Current reading
              </span>

            </div>


            <p>
              {explanation}
            </p>

          </div>


        ) : (


          /* =============================================
             NO ALERT
             ============================================= */

          <div className="station-history-empty">

            No recent alerts.

          </div>

        )}

      </section>

    </div>
  );
}
function TrendChart({ title, unit, history, valueKey, group }) {

  const points = history
    .map((entry, index) => ({
      timestamp: entry.timestamp,
      value: Number(group ? entry[group]?.[valueKey] : entry.weather_data?.[valueKey])
    }))
    .filter((point) => Number.isFinite(point.value))
    .map((point, index) => ({ ...point, index }))

  if (!points.length) {
    return (
      <div className="trend-card trend-empty">
        <strong>{title}</strong>
        <span>No historical data</span>
      </div>
    )
  }

  const width = 320
  const height = 130
  const padding = { top: 16, right: 12, bottom: 28, left: 34 }
  const min = Math.min(...points.map((point) => point.value))
  const max = Math.max(...points.map((point) => point.value))
  const spread = max - min || 1
  const x = (index) => padding.left + (index / Math.max(points.length - 1, 1)) * (width - padding.left - padding.right)
  const y = (value) => padding.top + (1 - (value - min) / spread) * (height - padding.top - padding.bottom)
  const line = points.map((point) => `${x(point.index)},${y(point.value)}`).join(' ')

  return (
    <div className="trend-card">
      <div className="trend-card-heading">
        <strong>{title}</strong>
        <span>{unit}</span>
      </div>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} trend`}>
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="trend-axis" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="trend-axis" />
        <polyline points={line} className="trend-line" />
        {points.map((point) => (
          <circle key={`${point.timestamp}-${point.index}`} cx={x(point.index)} cy={y(point.value)} r="3" className="trend-point">
            <title>{`${new Date(point.timestamp).toLocaleString()} · ${point.value}${unit}`}</title>
          </circle>
        ))}
        <text x={padding.left} y={height - 8} className="trend-label">{new Date(points[0].timestamp).toLocaleTimeString()}</text>
        <text x={width - padding.right} y={height - 8} textAnchor="end" className="trend-label">{new Date(points[points.length - 1].timestamp).toLocaleTimeString()}</text>
        <text x="4" y={padding.top + 4} className="trend-label">{max}</text>
        <text x="4" y={height - padding.bottom} className="trend-label">{min}</text>
      </svg>
    </div>
  )
}


function StationEvents({ history }) {

  const events = history.flatMap((entry) => (
    normalizeM3(entry.m3)
      .filter((event) => event.anomaly)
      .map((event) => ({
        ...event,
        timestamp: event.timestamp || entry.timestamp
      }))
  ))

  if (!events.length) {
    return <div className="station-history-empty">No station events available.</div>
  }

  return (
    <div className="station-events-list">
      {events.map((event, index) => (
        <div className="station-event" key={`${event.timestamp}-${index}`}>
          <span>{event.timestamp}</span>
          <strong>{event.anomaly_type || event.feature}</strong>
          <p>{event.reason || event.value}</p>
        </div>
      ))}
    </div>
  )
}


function HealthBar({ value }) {

  const numericValue = Number(value)
  const hasValue = Number.isFinite(numericValue)

  return (
    <div className="health-bar">
      <div className="health-bar-track">
        {hasValue && <span style={{ width: `${Math.max(0, Math.min(100, numericValue))}%` }} />}
      </div>
      <strong>{hasValue ? numericValue : ''}</strong>
      <small>Health Score</small>
    </div>
  )
}


// =====================================
// READING
// =====================================

function Reading({
  label,
  value
}) {

  const weatherDisplay = {
    temperature: ['Temperature', Thermometer, '°C'],
    humidity: ['Humidity', CloudSun, '%'],
    pressure: ['Pressure', Gauge, 'hPa'],
    wind_speed: ['Wind Speed', Wind, 'km/h'],
    rainfall: ['Rainfall', CloudRain, 'mm']
  }
  const [displayLabel, Icon, unit] = weatherDisplay[label] || [label, Activity, '']

  return (

    <div className="reading">

      <Icon size={15} />

      <div>

        <span>
          {displayLabel}
        </span>

        <strong>
          {value}{unit}
        </strong>

      </div>

    </div>
  )
}


function DetailField({ label, value }) {

  const displayValue = value !== null && typeof value === 'object'
    ? Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(' · ')
    : String(value)

  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  )
}


function FeatureHealthTable({ featureHealth, weatherData }) {

  if (!featureHealth || typeof featureHealth !== 'object') {
    return null
  }

  const weatherLabels = {
    temperature: 'Temperature',
    humidity: 'Humidity',
    pressure: 'Pressure',
    wind_speed: 'Wind Speed',
    rainfall: 'Rainfall'
  }

  return (
    <div className="feature-health-table">
      {Object.entries(featureHealth).map(([feature, health]) => (
        <FeatureHealthRow
          key={feature}
          feature={feature}
          health={health}
          currentValue={weatherData?.[feature]}
          label={weatherLabels[feature] || feature}
        />
      ))}
    </div>
  )
}


function FeatureHealthRow({ feature, health, currentValue, label }) {

  const numericHealth = Number(health?.value ?? health)
  const hasHealth = Number.isFinite(numericHealth)

  return (
    <div className="feature-health-row" data-feature={feature}>
          <div className="feature-health-label">
            <span>{label}</span>
            <small>{currentValue}</small>
          </div>
          <div className="feature-health-track">
            {hasHealth && <span style={{ width: `${Math.max(0, Math.min(100, numericHealth))}%` }} />}
          </div>
          <strong>{hasHealth ? numericHealth : ''}</strong>
          <small>{health?.status ?? ''}</small>
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