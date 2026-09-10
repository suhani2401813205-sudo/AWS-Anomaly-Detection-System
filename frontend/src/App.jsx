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
import {
  deriveStatus,
  getAnomalyType,
  getExplanation
} from './utils/helpers'
import {
  parameters,
  navItems
} from './config/constants'
import { StatCard } from './components/Shared'
import {
  SecondaryView,
  NotificationPanel,
  OverviewPanel
} from './components/Views'
import {
  StationDetailsView,
  AnomalyCard
} from './components/StationDetails'

const API_BASE = 'http://127.0.0.1:8000'

/* =========================================================
   INSERT ANOMALY CONFIGURATION
========================================================= */

const INSERT_PARAMETERS = [
  {
    key: 'temperature',
    label: 'Temperature'
  },
  {
    key: 'humidity',
    label: 'Humidity'
  },
  {
    key: 'pressure',
    label: 'Pressure'
  },
  {
    key: 'wind_speed',
    label: 'Wind Speed'
  },
  {
    key: 'rainfall',
    label: 'Rainfall'
  }
]

const INSERT_DURATIONS = [
  1,
  2,
  3,
  4,
  5,
  10,
  15,
  20
]

const INSERT_PATTERNS = [
  {
    key: 'single',
    label: 'Single Change'
  },
  {
    key: 'drift',
    label: 'Gradual Change (+2)'
  },
  {
    key: 'repeated',
    label: 'Repeated Value'
  },
  {
    key: 'missing',
    label: 'Missing Data'
  }
]

/*
  These values automatically populate when the
  user selects a parameter.
*/
const INSERT_PARAMETER_DEFAULTS = {
  temperature: {
    min: 15,
    max: 40,
    reference: 30,
    anomaly: 60
  },

  humidity: {
    min: 30,
    max: 90,
    reference: 60,
    anomaly: 10
  },

  pressure: {
    min: 980,
    max: 1030,
    reference: 1010,
    anomaly: 1060
  },

  wind_speed: {
    min: 0,
    max: 50,
    reference: 10,
    anomaly: 70
  },

  rainfall: {
    min: 0,
    max: 100,
    reference: 0,
    anomaly: 120
  }
}

const M3_PRIORITY = {
  SPIKE: 1,
  FROZEN_VALUE: 2,
  DRIFT: 3,
  MISSING_DATA: 4,
  TIMESTAMP_GAP: 5
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [parameter, setParameter] = useState('Temperature')

  const [liveData, setLiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedStationId, setSelectedStationId] =
    useState(null)

  const [stationSearchTerm, setStationSearchTerm] =
    useState('')

  const [stationStatusFilter, setStationStatusFilter] =
    useState('All')

  const [stationHistory, setStationHistory] =
    useState([])

  const [historyLoading, setHistoryLoading] =
    useState(false)

  const [historyError, setHistoryError] =
    useState(null)

  const [historyParameter, setHistoryParameter] =
    useState('temperature')

  const [dashboardHistory, setDashboardHistory] =
    useState([])

  const [dashboardHistoryLoading, setDashboardHistoryLoading] =
    useState(false)

  const [dashboardHistoryError, setDashboardHistoryError] =
    useState(null)

  const [isSidebarOpen, setSidebarOpen] =
    useState(false)

  const [autoRotate, setAutoRotate] =
    useState(true)

  const [globeAnimation, setGlobeAnimation] =
    useState(true)

  const [theme, setTheme] =
    useState('dark')

  const [unreadAlerts, setUnreadAlerts] =
    useState([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [notificationsOpen, setNotificationsOpen] =
    useState(false)

  const [liveParameter, setLiveParameter] =
    useState(null)

  const [criticalIndex, setCriticalIndex] =
    useState(0)

  /* =========================================================
     INSERT ANOMALY STATE
  ========================================================= */

  const [insertStationId, setInsertStationId] =
    useState('AWS_001')

  const [insertParameter, setInsertParameter] =
    useState('temperature')

  const [insertPattern, setInsertPattern] =
    useState('single')

  const [insertNormalMin, setInsertNormalMin] =
    useState('15')

  const [insertNormalMax, setInsertNormalMax] =
    useState('40')

  const [insertNormalValue, setInsertNormalValue] =
    useState('30')

  const [insertAnomalyValue, setInsertAnomalyValue] =
    useState('60')

  const [insertDuration, setInsertDuration] =
    useState(1)

  const [insertRunning, setInsertRunning] =
    useState(false)

  const [insertProgress, setInsertProgress] =
    useState(0)

  const [insertResult, setInsertResult] =
    useState(null)

  const [insertError, setInsertError] =
    useState('')

  const [insertMessage, setInsertMessage] =
    useState('')

  const globeRef = useRef()

  const current = parameters[parameter]

  /* =========================================================
     M3 HELPERS
  ========================================================= */

  function normalizeM3(value) {
    if (Array.isArray(value)) {
      return value
    }

    if (value && typeof value === 'object') {
      return [value]
    }

    return []
  }

  function getM3Anomalies(value) {
    return normalizeM3(value).filter(
      (item) => item && item.anomaly
    )
  }

  /* =========================================================
     CREATE STATIONS FROM BACKEND DATA
  ========================================================= */

  const stations =
    Array.isArray(liveData?.stations) &&
    liveData.stations.length
      ? liveData.stations
          .filter(
            (item) =>
              item && item.station
          )
          .map((item) => {
            const weather =
              item.weather_data || {}

            const m2 =
              item.m2 || {}

            const m3 =
              normalizeM3(item.m3)

            const m4 =
              item.m4 || {}

            const firstM3 =
              getM3Anomalies(m3)[0] || {}

            const status =
              deriveStatus(
                m2,
                firstM3,
                m4
              )

            const statusColors = {
              Healthy: '#55d6a3',
              Warning: '#ffc857',
              'High Risk': '#ff9955',
              Critical: '#ff6b5f'
            }

            const risk =
              Number(m4.risk_score)

            return {
              id: item.station.id,

              city:
                item.station.city ||
                item.station.name ||
                'Unknown',

              region:
                item.station.region ||
                item.station.state ||
                'Unknown',

              lat:
                Number(
                  item.station.latitude
                ) || 0,

              lng:
                Number(
                  item.station.longitude
                ) || 0,

              status,

              color:
                statusColors[status],

              risk:
                Number.isFinite(risk)
                  ? Math.round(risk)
                  : 0,

              temp:
                weather.temperature ??
                '—',

              humidity:
                weather.humidity ??
                '—',

              pressure:
                weather.pressure ??
                '—',

              wind:
                weather.wind_speed ??
                '—',

              rainfall:
                weather.rainfall ??
                '—',

              updated:
                item.timestamp
                  ? new Date(
                      item.timestamp
                    ).toLocaleTimeString()
                  : 'Just now',

              m2,
              m3,
              m4,

              metadata:
                item.station,

              weatherData:
                weather,

              sensorHealth:
                m4.sensor_health ??
                100,

              severity:
                m4.severity ||
                status,

              anomalyType:
                getAnomalyType(
                  m2,
                  firstM3,
                  m4
                ),

              explanation:
                getExplanation(
                  m4,
                  firstM3,
                  m2
                )
            }
          })
      : fallbackStations

  /* =========================================================
     ANOMALIES
  ========================================================= */

  const anomalyRows =
    stations.flatMap((station) => {
      const m3Anomalies =
        getM3Anomalies(
          station.m3
        )

      const mlStatus =
        String(
          station.m2?.ml_status ??
            station.m2?.status ??
            ''
        ).toLowerCase()

      const m2IsAnomaly =
        mlStatus.includes(
          'anomaly'
        )

      if (m3Anomalies.length) {
        return m3Anomalies.map(
          (
            result,
            resultIndex
          ) => {
            let parameterName =
              result?.feature ??
              'Weather parameter'

            if (
              Array.isArray(
                parameterName
              )
            ) {
              parameterName =
                parameterName
                  .map(
                    (item) =>
                      String(item)
                        .replace(
                          /_/g,
                          ' '
                        )
                        .replace(
                          /\b\w/g,
                          (c) =>
                            c.toUpperCase()
                        )
                  )
                  .join(', ')
            }

            let detectedValue =
              result?.value ??
              '—'

            if (
              Array.isArray(
                result?.details
              ) &&
              result.details.length
            ) {
              detectedValue =
                result.details
                  .map(
                    (detail) => {
                      if (
                        !detail?.feature
                      ) {
                        return null
                      }

                      const label =
                        String(
                          detail.feature
                        )
                          .replace(
                            /_/g,
                            ' '
                          )
                          .replace(
                            /\b\w/g,
                            (c) =>
                              c.toUpperCase()
                          )

                      return `${label}: ${
                        detail?.value ??
                        '—'
                      }`
                    }
                  )
                  .filter(Boolean)
                  .join(' • ')
            }

            let expectedValue =
              result?.expected_value

            if (!expectedValue) {
              const anomalyType =
                String(
                  result?.anomaly_type ||
                    ''
                ).toUpperCase()

              if (
                anomalyType ===
                'FROZEN_VALUE'
              ) {
                expectedValue =
                  'Variable reading'
              } else if (
                anomalyType ===
                'SPIKE'
              ) {
                expectedValue =
                  'Within normal variation'
              } else if (
                anomalyType ===
                'DRIFT'
              ) {
                expectedValue =
                  'Stable baseline'
              } else if (
                anomalyType ===
                'MISSING_DATA'
              ) {
                expectedValue =
                  'Value required'
              } else {
                expectedValue =
                  'Normal range'
              }
            }

            const hasM3Anomaly =
              Boolean(
                result?.anomaly
              )

            const isAnomaly =
              hasM3Anomaly ||
              m2IsAnomaly

            const displayStatus =
              isAnomaly
                ? 'ANOMALY'
                : 'NORMAL'

            const risk =
              Number(
                station.m4?.risk_score ??
                  0
              )

            const severity =
              station.m4?.severity ??
              station.status ??
              (risk >= 85
                ? 'Critical'
                : risk >= 65
                  ? 'High Risk'
                  : risk >= 35
                    ? 'Warning'
                    : 'Healthy')

            const rawConfidence =
              Number(
                station.m4?.confidence
              )

            const confidence =
              Number.isFinite(
                rawConfidence
              )
                ? `${Math.round(
                    rawConfidence * 100
                  )}%`
                : '—'

            return {
              station:
                station.id,

              city:
                station.city,

              type:
                result?.anomaly_type ||
                'Weather Anomaly',

              parameter:
                parameterName,

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
                result?.timestamp ||
                station.updated,

              description:
                station.m4?.explanation ||
                result?.reason ||
                'Weather anomaly detected.',

              source: 'M3',

              key: `${station.id}-${
                result?.anomaly_type ||
                'anomaly'
              }-${resultIndex}`
            }
          }
        )
      }

      if (m2IsAnomaly) {
        const parameterName =
          station.m2?.parameter ||
          'Weather parameter'

        const detectedValue =
          station.m2?.detected_value ??
          station.weatherData?.[
            parameterName
          ] ??
          '—'

        const risk =
          Number(
            station.m4?.risk_score ??
              0
          )

        return [
          {
            station:
              station.id,

            city:
              station.city,

            type:
              station.m2?.anomaly_type ??
              'ML Anomaly',

            parameter:
              parameterName,

            value:
              detectedValue,

            expected:
              station.m2
                ?.expected_value ??
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

            severity:
              station.m4?.severity ??
              station.status ??
              'Warning',

            status:
              'ANOMALY',

            time:
              station.updated,

            description:
              station.m4
                ?.explanation ||
              station.m2?.reason ||
              'Unusual weather pattern detected.',

            source: 'M2',

            key:
              `${station.id}-m2`
          }
        ]
      }

      return []
    })

  /* =========================================================
     ALERTS
  ========================================================= */

  const alerts =
    stations
      .filter((station) => {
        const mlStatus =
          String(
            station.m2?.ml_status ??
              station.m2?.status ??
              ''
          ).toLowerCase()

        const m3Anomaly =
          getM3Anomalies(
            station.m3
          ).length > 0

        return (
          mlStatus.includes(
            'anomaly'
          ) ||
          m3Anomaly ||
          station.status ===
            'Warning' ||
          station.status ===
            'High Risk' ||
          station.status ===
            'Critical'
        )
      })
      .map((station) => ({
        station:
          station.id,

        type:
          station.anomalyType,

        severity:
          station.status,

        risk:
          station.risk,

        time:
          station.updated,

        description:
          station.explanation,

        anomalyType:
          station.anomalyType
      }))

  const criticalAnomalies =
    anomalyRows

  const stationCounts =
    stations.reduce(
      (counts, station) => {
        counts[
          station.status
        ] =
          (counts[
            station.status
          ] || 0) + 1

        return counts
      },
      {}
    )

  const activeAnomalies =
    anomalyRows.length

  const selectedStation =
    stations.find(
      (station) =>
        station.id ===
        selectedStationId
    )

  /* =========================================================
     POPSTATE
  ========================================================= */

  useEffect(() => {
    const handlePopState =
      () => {
        setSelectedStationId(
          null
        )

        setActiveNav(
          'Stations'
        )

        setAutoRotate(true)
      }

    window.addEventListener(
      'popstate',
      handlePopState
    )

    return () =>
      window.removeEventListener(
        'popstate',
        handlePopState
      )
  }, [])

  /* =========================================================
     STATION HISTORY
  ========================================================= */

  useEffect(() => {
    if (!selectedStationId) {
      setStationHistory([])
      setHistoryError(null)
      setHistoryParameter(
        'temperature'
      )

      return undefined
    }

    const controller =
      new AbortController()

    const fetchStationHistory =
      async () => {
        try {
          setHistoryLoading(
            true
          )

          setHistoryError(null)

          const response =
            await fetch(
              `${API_BASE}/history/${encodeURIComponent(
                selectedStationId
              )}`,
              {
                signal:
                  controller.signal
              }
            )

          if (!response.ok) {
            throw new Error(
              `Failed to fetch station history: ${response.status}`
            )
          }

          const data =
            await response.json()

          setStationHistory(
            Array.isArray(
              data.data
            )
              ? data.data
              : []
          )
        } catch (err) {
          if (
            err.name ===
            'AbortError'
          ) {
            return
          }

          setStationHistory([])
          setHistoryError(
            err.message
          )
        } finally {
          setHistoryLoading(
            false
          )
        }
      }

    fetchStationHistory()

    return () =>
      controller.abort()
  }, [selectedStationId])

  /* =========================================================
     DASHBOARD HISTORY
  ========================================================= */

  useEffect(() => {
    const stationId =
      stations[0]?.id

    if (
      activeNav !==
        'Dashboard' ||
      selectedStationId ||
      !stationId
    ) {
      return undefined
    }

    const controller =
      new AbortController()

    const fetchDashboardHistory =
      async () => {
        try {
          setDashboardHistoryLoading(
            true
          )

          setDashboardHistoryError(
            null
          )

          const response =
            await fetch(
              `${API_BASE}/history/${encodeURIComponent(
                stationId
              )}`,
              {
                signal:
                  controller.signal
              }
            )

          if (!response.ok) {
            throw new Error(
              `Failed to fetch dashboard history: ${response.status}`
            )
          }

          const data =
            await response.json()

          setDashboardHistory(
            Array.isArray(
              data.data
            )
              ? data.data
              : []
          )
        } catch (err) {
          if (
            err.name ===
            'AbortError'
          ) {
            return
          }

          setDashboardHistory([])
          setDashboardHistoryError(
            err.message
          )
        } finally {
          setDashboardHistoryLoading(
            false
          )
        }
      }

    fetchDashboardHistory()

    return () =>
      controller.abort()
  }, [
    activeNav,
    selectedStationId,
    stations[0]?.id
  ])

  /* =========================================================
     LIVE DATA
  ========================================================= */

  useEffect(() => {
    let mounted = true

    const fetchLiveData =
      async () => {
        try {
          setLoading(true)
          setError(null)

          const response =
            await fetch(
              `${API_BASE}/predict/live`
            )

          if (!response.ok) {
            throw new Error(
              `Failed to fetch live weather data: ${response.status}`
            )
          }

          const data =
            await response.json()

          if (mounted) {
            console.log(
              'LIVE BACKEND DATA:',
              JSON.stringify(
                data,
                null,
                2
              )
            )

            setLiveData(data)
          }
        } catch (err) {
          if (mounted) {
            console.error(
              'Backend error:',
              err
            )

            setError(
              err.message
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    fetchLiveData()

    const interval =
      setInterval(
        fetchLiveData,
        60000
      )

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  /* =========================================================
     UNREAD ALERTS
  ========================================================= */

  useEffect(() => {
    const newAlertIds =
      alerts.map(
        (alert) =>
          `${alert.station}-${alert.type}`
      )

    setUnreadAlerts(
      (currentUnread) => {
        const stillValid =
          currentUnread.filter(
            (id) =>
              newAlertIds.includes(
                id
              )
          )

        const newOnes =
          newAlertIds.filter(
            (id) =>
              !stillValid.includes(
                id
              )
          )

        return [
          ...stillValid,
          ...newOnes
        ]
      }
    )
  }, [liveData])

  /* =========================================================
     GLOBE
  ========================================================= */

  useEffect(() => {
    const controls =
      globeRef.current?.controls()

    if (!controls) {
      return
    }

    controls.autoRotate =
      autoRotate &&
      globeAnimation

    controls.autoRotateSpeed =
      0.5
  }, [
    autoRotate,
    globeAnimation
  ])

  useEffect(() => {
    setCriticalIndex(0)
  }, [criticalAnomalies.length])

  useEffect(() => {
    if (
      criticalAnomalies.length <=
      1
    ) {
      return undefined
    }

    const timer =
      setInterval(() => {
        setCriticalIndex(
          (index) =>
            (index + 1) %
            criticalAnomalies.length
        )
      }, 7000)

    return () =>
      clearInterval(timer)
  }, [criticalAnomalies.length])

  useEffect(() => {
    const close = () =>
      setNotificationsOpen(
        false
      )

    if (!notificationsOpen) {
      return undefined
    }

    document.addEventListener(
      'click',
      close
    )

    return () =>
      document.removeEventListener(
        'click',
        close
      )
  }, [notificationsOpen])

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const selectStation =
    (station) => {
      setSelectedStationId(
        station.id
      )

      window.history.pushState(
        {
          stationId:
            station.id
        },
        '',
        window.location.href
      )

      setAutoRotate(false)
      setSearchTerm('')
      setNotificationsOpen(
        false
      )

      const controls =
        globeRef.current?.controls()

      if (controls) {
        controls.autoRotate =
          false
      }
    }

  const openNav = (name) => {
    setActiveNav(name)
    setSelectedStationId(null)
    setSidebarOpen(false)
  }

  const markAlertRead =
    (alert) => {
      setUnreadAlerts(
        (currentUnread) =>
          currentUnread.filter(
            (id) =>
              id !==
              `${alert.station}-${alert.type}`
          )
      )

      const station =
        stations.find(
          (item) =>
            item.id ===
            alert.station
        )

      if (station) {
        selectStation(station)
      }
    }

  /* =========================================================
     SEARCH
  ========================================================= */

  const searchResults =
    searchTerm.trim()
      ? [
          ...stations
            .filter(
              (station) =>
                `${station.id} ${station.city} ${station.region} ${station.status}`
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  )
            )
            .map(
              (station) => ({
                type:
                  'Station',

                label:
                  station.id,

                detail:
                  `${station.city}, ${station.region}`,

                action:
                  () =>
                    selectStation(
                      station
                    )
              })
            ),

          ...alerts
            .filter(
              (alert) =>
                `${alert.station} ${alert.type} ${alert.severity} ${alert.description}`
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  )
            )
            .map(
              (alert) => ({
                type:
                  'Alert',

                label:
                  `${alert.station} · ${alert.type}`,

                detail:
                  `${alert.severity} · risk ${alert.risk}`,

                action:
                  () =>
                    markAlertRead(
                      alert
                    )
              })
            ),

          ...Object.keys(
            parameters
          )
            .filter(
              (name) =>
                name
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  )
            )
            .map(
              (name) => ({
                type:
                  'Parameter',

                label:
                  name,

                detail:
                  parameters[
                    name
                  ].label,

                action: () => {
                  setParameter(
                    name
                  )

                  setActiveNav(
                    'Dashboard'
                  )

                  setSearchTerm('')
                }
              })
            )
        ].slice(0, 6)
      : []

  const markAllRead =
    () => setUnreadAlerts([])

  /* =========================================================
     INSERT ANOMALY HELPERS
  ========================================================= */

  const getStationWeather =
    (stationId) => {
      const station =
        stations.find(
          (item) =>
            item.id ===
            stationId
        )

      const weather =
        station?.weatherData ||
        {}

      const getSafeNumber =
        (
          value,
          fallback
        ) => {
          const number =
            Number(value)

          return Number.isFinite(
            number
          )
            ? number
            : fallback
        }

      return {
        pressure:
          getSafeNumber(
            weather.pressure,
            1010
          ),

        temperature:
          getSafeNumber(
            weather.temperature,
            30
          ),

        humidity:
          getSafeNumber(
            weather.humidity,
            60
          ),

        wind_speed:
          getSafeNumber(
            weather.wind_speed,
            8
          ),

        rainfall:
          getSafeNumber(
            weather.rainfall,
            0
          )
      }
    }

  /*
    IMPORTANT:
    null stays null.
    This is required for Missing Data.
  */
  const buildInsertPayload =
    (
      stationId,
      parameterName,
      value
    ) => {
      const base =
        getStationWeather(
          stationId
        )

      const parsedValue =
        value === null ||
        value === undefined ||
        value === ''
          ? null
          : Number(value)

      return {
        ...base,
        [parameterName]:
          parsedValue
      }
    }

  const updateLiveStationFromPrediction =
    (
      stationId,
      prediction
    ) => {
      setLiveData(
        (currentData) => {
          if (
            !currentData?.stations
          ) {
            return currentData
          }

          return {
            ...currentData,

            stations:
              currentData.stations.map(
                (item) =>
                  item?.station
                    ?.id ===
                  stationId
                    ? {
                        ...item,

                        timestamp:
                          prediction.timestamp,

                        weather_data:
                          prediction.weather_data,

                        m2:
                          prediction.m2,

                        m3:
                          prediction.m3,

                        m4:
                          prediction.m4
                      }
                    : item
              )
          }
        }
      )
    }

  /* =========================================================
     PARAMETER CHANGE
  ========================================================= */

  const handleInsertParameterChange =
    (newParameter) => {
      setInsertParameter(
        newParameter
      )

      const defaults =
        INSERT_PARAMETER_DEFAULTS[
          newParameter
        ]

      if (!defaults) {
        return
      }

      setInsertNormalMin(
        String(defaults.min)
      )

      setInsertNormalMax(
        String(defaults.max)
      )

      setInsertNormalValue(
        String(
          defaults.reference
        )
      )

      setInsertAnomalyValue(
        String(
          defaults.anomaly
        )
      )

      /*
        When changing parameter,
        keep the selected pattern,
        but adjust duration if necessary.
      */

      if (
        insertPattern ===
        'drift' &&
        insertDuration < 10
      ) {
        setInsertDuration(10)
      }

      if (
        insertPattern ===
        'repeated' &&
        insertDuration < 5
      ) {
        setInsertDuration(5)
      }

      setInsertResult(null)
      setInsertError('')
      setInsertMessage('')
      setInsertProgress(0)
    }

  /* =========================================================
     PATTERN CHANGE
  ========================================================= */

  const handleInsertPatternChange =
    (newPattern) => {
      setInsertPattern(
        newPattern
      )

      /*
        Gradual Change requires
        10 readings for M3 drift.
      */
      if (
        newPattern ===
          'drift' &&
        insertDuration < 10
      ) {
        setInsertDuration(10)
      }

      /*
        Frozen value requires
        5 consecutive identical readings.
      */
      if (
        newPattern ===
          'repeated' &&
        insertDuration < 5
      ) {
        setInsertDuration(5)
      }

      /*
        Missing Data works even
        with one reading.
      */
      if (
        newPattern ===
        'missing'
      ) {
        if (
          !INSERT_DURATIONS.includes(
            insertDuration
          )
        ) {
          setInsertDuration(1)
        }
      }

      setInsertResult(null)
      setInsertError('')
      setInsertMessage('')
      setInsertProgress(0)
    }

  /* =========================================================
     GET VALID DURATIONS FOR PATTERN
  ========================================================= */

  const getAvailableDurations =
    () => {
      if (
        insertPattern ===
        'drift'
      ) {
        return INSERT_DURATIONS.filter(
          (value) =>
            value >= 10
        )
      }

      if (
        insertPattern ===
        'repeated'
      ) {
        return INSERT_DURATIONS.filter(
          (value) =>
            value >= 5
        )
      }

      return INSERT_DURATIONS
    }

  const availableDurations =
    getAvailableDurations()

  /* =========================================================
     BUILD PREVIEW SEQUENCE
  ========================================================= */

  const getInjectionSequence =
    () => {
      const duration =
        Number(
          insertDuration
        )

      const normalValue =
        Number(
          insertNormalValue
        )

      const anomalyValue =
        Number(
          insertAnomalyValue
        )

      if (
        !Number.isFinite(
          duration
        )
      ) {
        return []
      }

      /*
        SINGLE CHANGE
        Reference → anomaly
      */
      if (
        insertPattern ===
        'single'
      ) {
        return Array(
          duration
        ).fill(
          anomalyValue
        )
      }

      /*
        REPEATED VALUE
        Same value repeatedly.
        M3 can detect FROZEN_VALUE.
      */
      if (
        insertPattern ===
        'repeated'
      ) {
        return Array(
          duration
        ).fill(
          anomalyValue
        )
      }

      /*
        GRADUAL CHANGE
        Example:
        30 → 32 → 34 → 36 ...
      */
      if (
        insertPattern ===
        'drift'
      ) {
        return Array.from(
          {
            length:
              duration
          },
          (_, index) =>
            normalValue +
            (index + 1) * 2
        )
      }

      /*
        MISSING DATA
      */
      if (
        insertPattern ===
        'missing'
      ) {
        return Array(
          duration
        ).fill(null)
      }

      return []
    }

  const injectionSequence =
    getInjectionSequence()

  /* =========================================================
     PREVIEW FORMATTER
  ========================================================= */

  const formatPreviewValue =
    (value) => {
      if (
        value === null ||
        value === undefined
      ) {
        return 'NULL'
      }

      return value
    }

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetInsertForm =
    () => {
      const firstStation =
        stations[0]?.id ||
        'AWS_001'

      const defaults =
        INSERT_PARAMETER_DEFAULTS[
          'temperature'
        ]

      setInsertStationId(
        firstStation
      )

      setInsertParameter(
        'temperature'
      )

      setInsertPattern(
        'single'
      )

      setInsertNormalMin(
        String(defaults.min)
      )

      setInsertNormalMax(
        String(defaults.max)
      )

      setInsertNormalValue(
        String(
          defaults.reference
        )
      )

      setInsertAnomalyValue(
        String(
          defaults.anomaly
        )
      )

      setInsertDuration(1)

      setInsertProgress(0)
      setInsertResult(null)
      setInsertError('')
      setInsertMessage('')
    }

  /* =========================================================
     INSERT ANOMALY
  ========================================================= */

  const insertAnomaly =
    async () => {
      if (insertRunning) {
        return
      }

      const normalMin =
        Number(
          insertNormalMin
        )

      const normalMax =
        Number(
          insertNormalMax
        )

      const normalValue =
        Number(
          insertNormalValue
        )

      const anomalyValue =
        Number(
          insertAnomalyValue
        )

      const duration =
        Number(
          insertDuration
        )

      setInsertError('')
      setInsertMessage('')
      setInsertResult(null)

      /*
        Normal configuration is
        automatically generated, but
        keep this validation for safety.
      */
      if (
        !Number.isFinite(
          normalMin
        ) ||
        !Number.isFinite(
          normalMax
        ) ||
        !Number.isFinite(
          normalValue
        )
      ) {
        setInsertError(
          'Invalid normal parameter configuration.'
        )

        return
      }

      if (
        normalMin >=
        normalMax
      ) {
        setInsertError(
          'Invalid normal range configuration.'
        )

        return
      }

      /*
        Anomaly value is NOT required
        to be outside the normal range.

        This is intentionally removed.

        Why?

        Because:
        - SPIKE needs sudden change
        - DRIFT needs gradual change
        - FROZEN_VALUE needs repeated value
        - MISSING_DATA uses null
      */

      if (
        insertPattern !==
          'missing' &&
        !Number.isFinite(
          anomalyValue
        )
      ) {
        setInsertError(
          'Please provide a valid injected value.'
        )

        return
      }

      if (
        !availableDurations.includes(
          duration
        )
      ) {
        if (
          insertPattern ===
          'drift'
        ) {
          setInsertError(
            'Gradual Change requires at least 10 readings.'
          )
        } else if (
          insertPattern ===
          'repeated'
        ) {
          setInsertError(
            'Repeated Value requires at least 5 readings.'
          )
        } else {
          setInsertError(
            'Please select a valid number of readings.'
          )
        }

        return
      }

      /*
        Generate actual values
        that will be sent to backend.
      */
      const sequence =
        getInjectionSequence()

      if (
        sequence.length !==
        duration
      ) {
        setInsertError(
          'Could not generate the injection sequence.'
        )

        return
      }

      setInsertRunning(true)
      setInsertProgress(0)

      try {
        /*
          =====================================================
          STEP 1
          Send a known normal/reference reading.
          =====================================================
        */

        const referencePayload =
          buildInsertPayload(
            insertStationId,
            insertParameter,
            normalValue
          )

        const referenceResponse =
          await fetch(
            `${API_BASE}/predict/${encodeURIComponent(
              insertStationId
            )}`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  referencePayload
                )
            }
          )

        if (
          !referenceResponse.ok
        ) {
          throw new Error(
            `Reference reading failed: ${referenceResponse.status}`
          )
        }

        const referenceResult =
          await referenceResponse.json()

        updateLiveStationFromPrediction(
          insertStationId,
          referenceResult
        )

        /*
          =====================================================
          STEP 2
          Send actual pattern sequence.
          =====================================================
        */

        let finalResult =
          referenceResult

        for (
          let i = 0;
          i < sequence.length;
          i += 1
        ) {
          const value =
            sequence[i]

          /*
            For Missing Data this
            remains null.
          */
          const anomalyPayload =
            buildInsertPayload(
              insertStationId,
              insertParameter,
              value
            )

          const response =
            await fetch(
              `${API_BASE}/predict/${encodeURIComponent(
                insertStationId
              )}`,
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(
                    anomalyPayload
                  )
              }
            )

          if (!response.ok) {
            throw new Error(
              `Reading ${i + 1} failed: ${response.status}`
            )
          }

          finalResult =
            await response.json()

          updateLiveStationFromPrediction(
            insertStationId,
            finalResult
          )

          setInsertProgress(
            Math.round(
              ((i + 1) /
                sequence.length) *
                100
            )
          )

          setInsertResult(
            finalResult
          )
        }

        setInsertProgress(100)

        const patternLabel =
          INSERT_PATTERNS.find(
            (item) =>
              item.key ===
              insertPattern
          )?.label ||
          insertPattern

        setInsertMessage(
          `${patternLabel} completed with ${duration} reading${
            duration > 1
              ? 's'
              : ''
          }. Actual M2 → M3 → M4 pipeline completed.`
        )

        setInsertResult(
          finalResult
        )
      } catch (err) {
        console.error(
          'Insert anomaly error:',
          err
        )

        setInsertError(
          err.message ||
            'Failed to insert anomaly.'
        )
      } finally {
        setInsertRunning(false)
      }
    }

  const selectedInsertStation =
    stations.find(
      (station) =>
        station.id ===
        insertStationId
    ) || stations[0]

  /* =========================================================
     FINAL INSERT RESULT
  ========================================================= */

  const resultM3 =
    normalizeM3(
      insertResult?.m3
    ).filter(
      (item) => item
    )

  /*
    M3 should already return the
    dominant anomaly from backend.

    This frontend priority is simply
    a safety fallback.
  */
  const detectedM3 =
    resultM3
      .filter(
        (item) =>
          item?.anomaly
      )
      .sort(
        (a, b) =>
          (M3_PRIORITY[
            a?.anomaly_type
          ] ?? 99) -
          (M3_PRIORITY[
            b?.anomaly_type
          ] ?? 99)
      )[0] || {}

  const resultM2 =
    insertResult?.m2 || {}

  const resultM4 =
    insertResult?.m4 || {}

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`app-shell ${
        theme === 'light'
          ? 'light-theme'
          : ''
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          isSidebarOpen
            ? 'open'
            : ''
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <Activity
              size={21}
            />
          </div>

          <div>
            <strong>
              ATMOS
              <span>AI</span>
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
                  activeNav ===
                  name
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  openNav(name)
                }
              >
                <Icon size={17} />

                <span>
                  {name}
                </span>

                {name ===
                  'Alerts' &&
                  unreadAlerts.length >
                    0 && (
                    <b className="nav-badge">
                      {
                        unreadAlerts.length
                      }
                    </b>
                  )}
              </button>
            )
          )}

          {/* =================================================
              INSERT ANOMALY
          ================================================= */}

          <button
            className={
              activeNav ===
              'Insert Anomaly'
                ? 'active'
                : ''
            }
            onClick={() =>
              openNav(
                'Insert Anomaly'
              )
            }
          >
            <Zap size={17} />

            <span>
              Insert Anomaly
            </span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <i />
            All systems operational
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

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
              {activeNav ===
              'Dashboard'
                ? 'Command center'
                : activeNav}
            </h1>
          </div>

          <div className="top-actions">
            {/* SEARCH */}

            <div className="global-search">
              <Search size={15} />

              <input
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                placeholder="Search stations, alerts..."
              />

              <button
                className="search-clear"
                onClick={() =>
                  setSearchTerm(
                    ''
                  )
                }
                aria-label="Clear search"
              >
                {searchTerm ? (
                  <X size={13} />
                ) : null}
              </button>

              {searchTerm && (
                <div className="search-results">
                  {searchResults.length ? (
                    searchResults.map(
                      (
                        result
                      ) => (
                        <button
                          key={`${result.type}-${result.label}`}
                          onClick={
                            result.action
                          }
                        >
                          <span>
                            {
                              result.type
                            }
                          </span>

                          <strong>
                            {
                              result.label
                            }
                          </strong>

                          <small>
                            {
                              result.detail
                            }
                          </small>
                        </button>
                      )
                    )
                  ) : (
                    <div className="search-empty">
                      No stations,
                      alerts, or
                      parameters
                      found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}

            <div className="notification-wrap">
              <button
                className={`icon-button notification ${
                  notificationsOpen
                    ? 'active'
                    : ''
                }`}
                onClick={(
                  event
                ) => {
                  event.stopPropagation()

                  setNotificationsOpen(
                    (open) =>
                      !open
                  )
                }}
              >
                <Bell size={17} />

                {unreadAlerts.length >
                  0 && (
                  <b>
                    {
                      unreadAlerts.length
                    }
                  </b>
                )}
              </button>

              {notificationsOpen && (
                <NotificationPanel
                  alerts={
                    alerts
                  }
                  unreadAlerts={
                    unreadAlerts
                  }
                  markAlertRead={
                    markAlertRead
                  }
                  markAllRead={
                    markAllRead
                  }
                />
              )}
            </div>
          </div>
        </header>

        {/* =====================================================
            INSERT ANOMALY PAGE
        ===================================================== */}

        {activeNav ===
        'Insert Anomaly' ? (
          <div className="dashboard-content insert-anomaly-page">
            <section className="insert-anomaly-header">
              <span className="section-kicker">
                MANUAL TESTING ·
                M2 → M3 → M4
              </span>

              <h2>
                Insert Anomaly
              </h2>

              <p>
                Define a test pattern
                and send the generated
                readings through the
                actual M2 → M3 → M4
                pipeline.
              </p>
            </section>

            <section className="insert-anomaly-layout">
              {/* =================================================
                  LEFT FORM
              ================================================= */}

              <div className="insert-anomaly-form">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">
                      ANOMALY INPUT
                    </span>

                    <h2>
                      Define the test
                    </h2>
                  </div>
                </div>

                {/* STATION */}

                <div className="insert-field">
                  <label>
                    Station
                  </label>

                  <select
                    value={
                      insertStationId
                    }
                    onChange={(
                      event
                    ) =>
                      setInsertStationId(
                        event.target
                          .value
                      )
                    }
                  >
                    {stations.map(
                      (
                        station
                      ) => (
                        <option
                          key={
                            station.id
                          }
                          value={
                            station.id
                          }
                        >
                          {
                            station.id
                          }{' '}
                          –{' '}
                          {
                            station.city
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PARAMETER */}

                <div className="insert-field">
                  <label>
                    Parameter
                  </label>

                  <select
                    value={
                      insertParameter
                    }
                    onChange={(
                      event
                    ) =>
                      handleInsertParameterChange(
                        event.target
                          .value
                      )
                    }
                  >
                    {INSERT_PARAMETERS.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.key
                          }
                          value={
                            item.key
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* =================================================
                    AUTOMATIC NORMAL RANGE
                ================================================= */}

                <div className="insert-range">
                  <div className="insert-field">
                    <label>
                      Normal minimum
                    </label>

                    <input
                      type="number"
                      value={
                        insertNormalMin
                      }
                      readOnly
                    />
                  </div>

                  <div className="insert-field">
                    <label>
                      Normal maximum
                    </label>

                    <input
                      type="number"
                      value={
                        insertNormalMax
                      }
                      readOnly
                    />
                  </div>
                </div>

                {/* NORMAL REFERENCE */}

                <div className="insert-field">
                  <label>
                    Normal reference value
                  </label>

                  <input
                    type="number"
                    value={
                      insertNormalValue
                    }
                    readOnly
                  />

                  <small className="insert-help">
                    Automatically
                    selected from
                    the normal
                    configuration.
                    This reading is
                    sent first as
                    the baseline.
                  </small>
                </div>

                {/* =================================================
                    INJECTION PATTERN
                ================================================= */}

                <div className="insert-field">
                  <label>
                    Injection pattern
                  </label>

                  <select
                    value={
                      insertPattern
                    }
                    onChange={(
                      event
                    ) =>
                      handleInsertPatternChange(
                        event.target
                          .value
                      )
                    }
                  >
                    {INSERT_PATTERNS.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.key
                          }
                          value={
                            item.key
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>

                  <small className="insert-help">
                    M3 automatically
                    identifies the
                    resulting anomaly
                    type.
                  </small>
                </div>

                {/* =================================================
                    INJECTED VALUE
                ================================================= */}

                {insertPattern !==
                  'missing' &&
                  insertPattern !==
                    'drift' && (
                    <div className="insert-field">
                      <label>
                        Injected value
                      </label>

                      <input
                        type="number"
                        value={
                          insertAnomalyValue
                        }
                        onChange={(
                          event
                        ) =>
                          setInsertAnomalyValue(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Example: 60"
                      />

                      <small className="insert-help">
                        Used by
                        Single Change
                        and Repeated
                        Value.
                      </small>
                    </div>
                  )}

                {/* =================================================
                    DRIFT INFO
                ================================================= */}

                {insertPattern ===
                  'drift' && (
                  <div className="insert-preview">
                    <span>
                      Gradual change
                    </span>

                    <strong>
                      +2 per reading
                    </strong>

                    <small>
                      Example:{' '}
                      {
                        insertNormalValue
                      }
                      {' → '}
                      {Number(
                        insertNormalValue
                      ) + 2}
                      {' → '}
                      {Number(
                        insertNormalValue
                      ) + 4}
                      {' → '}
                      ...
                    </small>
                  </div>
                )}

                {/* =================================================
                    MISSING DATA INFO
                ================================================= */}

                {insertPattern ===
                  'missing' && (
                  <div className="insert-preview">
                    <span>
                      Missing data
                    </span>

                    <strong>
                      NULL
                    </strong>

                    <small>
                      Actual null
                      values will be
                      sent to the
                      backend. M3
                      identifies
                      MISSING_DATA.
                    </small>
                  </div>
                )}

                {/* =================================================
                    DURATION
                ================================================= */}

                <div className="insert-field">
                  <label>
                    Number of readings
                  </label>

                  <select
                    value={
                      insertDuration
                    }
                    onChange={(
                      event
                    ) =>
                      setInsertDuration(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  >
                    {availableDurations.map(
                      (
                        value
                      ) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {value}{' '}
                          reading
                          {value >
                          1
                            ? 's'
                            : ''}
                        </option>
                      )
                    )}
                  </select>

                  <small className="insert-help">
                    {insertPattern ===
                    'drift'
                      ? 'Gradual Change uses at least 10 readings so M3 can detect drift.'
                      : insertPattern ===
                          'repeated'
                        ? 'Repeated Value uses at least 5 readings so M3 can detect a frozen value.'
                        : 'Select how many readings to inject.'}
                  </small>
                </div>

                {/* =================================================
                    ACTUAL PREVIEW
                ================================================= */}

                <div className="insert-preview">
                  <span>
                    Test preview
                  </span>

                  <strong>
                    {
                      selectedInsertStation?.id ||
                      'Station'
                    }

                    {' · '}

                    {INSERT_PARAMETERS.find(
                      (
                        item
                      ) =>
                        item.key ===
                        insertParameter
                    )?.label ||
                      insertParameter}
                  </strong>

                  <small>
                    Normal reference:{' '}
                    {
                      insertNormalValue
                    }
                    {' → '}

                    {injectionSequence
                      .slice(
                        0,
                        10
                      )
                      .map(
                        (
                          value,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                          >
                            {index >
                            0
                              ? ' → '
                              : ''}
                            {
                              formatPreviewValue(
                                value
                              )
                            }
                          </span>
                        )
                      )}

                    {injectionSequence.length >
                      10 &&
                      ' → ...'}
                  </small>
                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="insert-actions">
                  <button
                    className="insert-btn"
                    onClick={
                      insertAnomaly
                    }
                    disabled={
                      insertRunning ||
                      loading
                    }
                  >
                    <Zap size={16} />

                    {insertRunning
                      ? 'Running pipeline...'
                      : 'Insert Anomaly'}
                  </button>

                  <button
                    className="insert-reset-btn"
                    onClick={
                      resetInsertForm
                    }
                    disabled={
                      insertRunning
                    }
                  >
                    Reset
                  </button>
                </div>

                {/* PROGRESS */}

                {insertRunning && (
                  <div className="insert-progress-wrap">
                    <div className="insert-progress-label">
                      <span>
                        Sending readings
                        to backend
                      </span>

                      <b>
                        {
                          insertProgress
                        }
                        %
                      </b>
                    </div>

                    <div className="insert-progress">
                      <div
                        className="insert-progress-bar"
                        style={{
                          width: `${insertProgress}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SUCCESS */}

                {insertMessage && (
                  <div className="insert-message">
                    <Check size={15} />

                    {
                      insertMessage
                    }
                  </div>
                )}

                {/* ERROR */}

                {insertError && (
                  <div className="insert-error">
                    <AlertTriangle
                      size={15}
                    />

                    {
                      insertError
                    }
                  </div>
                )}
              </div>

              {/* =================================================
                  RIGHT RESULT PANEL
              ================================================= */}

              <div className="insert-anomaly-result">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">
                      ACTUAL PIPELINE
                      RESULT
                    </span>

                    <h2>
                      Detection output
                    </h2>
                  </div>
                </div>

                <div className="pipeline-flow">
                  <span>
                    M2 · Isolation
                    Forest
                  </span>

                  <b>→</b>

                  <span>
                    M3 · Rule Engine
                  </span>

                  <b>→</b>

                  <span>
                    M4 · Risk
                    Analysis
                  </span>
                </div>

                {!insertResult ? (
                  <div className="insert-empty-result">
                    <Zap
                      size={25}
                    />

                    <strong>
                      No test run yet
                    </strong>

                    <p>
                      Choose an
                      injection
                      pattern and
                      run the test.
                      The real
                      backend result
                      will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* =================================================
                        RESULT GRID
                    ================================================= */}

                    <div className="insert-result-grid">
                      {/* M2 */}

{/*<div className="result-card">
  <span className="result-card-label">
    M2 · ML STATUS
  </span>

  <strong
    className={
      String(
        resultM2.ml_status ??
        resultM2.status ??
        ''
      )
        .toLowerCase()
        .includes('anomaly')
        ? 'insert-anomaly-detected'
        : 'insert-normal'
    }
  >
    {resultM2.ml_status ??
      resultM2.status ??
      'Normal'}
  </strong>

  <small>
    Anomaly score:{' '}
    {resultM2.anomaly_score ?? '—'}
  </small>
</div>*/}

                      {/* M3 */}

                      <div className="result-card">
                        <span className="result-card-label">
                          M3 · DETECTED
                        </span>

                        <strong className="insert-anomaly-detected">
                          {detectedM3.anomaly
                            ? detectedM3.anomaly_type
                            : 'NORMAL'}
                        </strong>

                        <small>
                          Feature:{' '}
                          {Array.isArray(
                            detectedM3.feature
                          )
                            ? detectedM3.feature.join(
                                ', '
                              )
                            : detectedM3.feature ||
                              '—'}
                        </small>
                      </div>

                      {/* M4 */}

                      <div className="result-card">
                        <span className="result-card-label">
                          M4 · RISK
                        </span>

                        <strong
                          className={
                            Number(
                              resultM4.risk_score
                            ) >= 85
                              ? 'insert-critical'
                              : Number(
                                    resultM4.risk_score
                                  ) >= 65
                                ? 'insert-high'
                                : 'insert-warning'
                          }
                        >
                          {Number.isFinite(
                            Number(
                              resultM4.risk_score
                            )
                          )
                            ? `${Math.round(
                                Number(
                                  resultM4.risk_score
                                )
                              )}/100`
                            : '—'}
                        </strong>

                        <small>
                          Severity:{' '}
                          {resultM4.severity ||
                            '—'}
                        </small>
                      </div>

                      {/* SENSOR HEALTH */}

                      <div className="result-card">
                        <span className="result-card-label">
                          SENSOR HEALTH
                        </span>

                        <strong>
                          {resultM4.sensor_health ??
                            '—'}

                          {resultM4.sensor_health !==
                            undefined
                            ? '/100'
                            : ''}
                        </strong>

                        <small>
                          Confidence:{' '}
                          {Number.isFinite(
                            Number(
                              resultM4.confidence
                            )
                          )
                            ? `${Math.round(
                                Number(
                                  resultM4.confidence
                                ) * 100
                              )}%`
                            : '—'}
                        </small>
                      </div>
                    </div>

                    {/* =================================================
                        DETECTED VALUE
                    ================================================= */}

                    <div className="insert-result-detail">
                      <span className="result-card-label">
                        DETECTED VALUE
                      </span>

                      <strong>
                        {detectedM3.value ??
                          insertResult
                            ?.weather_data?.[
                            insertParameter
                          ] ??
                          '—'}
                      </strong>

                      <small>
                        {
                          INSERT_PARAMETERS.find(
                            (
                              item
                            ) =>
                              item.key ===
                              insertParameter
                          )?.label ||
                          insertParameter
                        }

                        {' · '}

                        Pattern:{' '}

                        {
                          INSERT_PATTERNS.find(
                            (
                              item
                            ) =>
                              item.key ===
                              insertPattern
                          )?.label ||
                          insertPattern
                        }
                      </small>
                    </div>

                    {/* =================================================
                        M3 REASON
                    ================================================= */}

                    <div className="insert-explanation">
                      <span className="result-card-label">
                        M3 REASON
                      </span>

                      <p>
                        {detectedM3.reason ||
                          'No anomaly reason returned.'}
                      </p>
                    </div>

                    {/* =================================================
                        M4 EXPLANATION
                    ================================================= */}

                    <div className="insert-explanation">
                      <span className="result-card-label">
                        M4 EXPLANATION
                      </span>

                      <p>
                        {resultM4.explanation ||
                          'No M4 explanation returned.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        ) : selectedStation ? (
          /* =====================================================
             STATION DETAILS
          ===================================================== */

          <StationDetailsView
            station={
              selectedStation
            }
            history={
              stationHistory
            }
            historyLoading={
              historyLoading
            }
            historyError={
              historyError
            }
            historyParameter={
              historyParameter
            }
            setHistoryParameter={
              setHistoryParameter
            }
            onBack={() => {
              if (
                window.history
                  .state
                  ?.stationId
              ) {
                window.history.back()
              } else {
                setSelectedStationId(
                  null
                )

                setActiveNav(
                  'Stations'
                )

                setAutoRotate(
                  true
                )
              }
            }}
          />
        ) : activeNav !==
          'Dashboard' ? (
          /* =====================================================
             SECONDARY VIEWS
          ===================================================== */

          <SecondaryView
            view={
              activeNav
            }
            stations={
              stations
            }
            alerts={
              alerts
            }
            anomalyRows={
              anomalyRows
            }
            setActiveNav={
              setActiveNav
            }
            selectStation={
              selectStation
            }
            theme={
              theme
            }
            setTheme={
              setTheme
            }
            markAlertRead={
              markAlertRead
            }
            liveParameter={
              liveParameter
            }
            setLiveParameter={
              setLiveParameter
            }
            globeAnimation={
              globeAnimation
            }
            setGlobeAnimation={
              setGlobeAnimation
            }
            stationSearchTerm={
              stationSearchTerm
            }
            setStationSearchTerm={
              setStationSearchTerm
            }
            stationStatusFilter={
              stationStatusFilter
            }
            setStationStatusFilter={
              setStationStatusFilter
            }
          />
        ) : (
          /* =====================================================
             DASHBOARD
          ===================================================== */

          <div className="dashboard-content">
            <section className="stats-row">
              <StatCard
                label="Total stations"
                value={
                  stations.length
                }
                tone="cyan"
                icon={Globe2}
              />

              <StatCard
                label="Healthy"
                value={
                  stationCounts.Healthy ||
                  0
                }
                tone="green"
                icon={Check}
              />

              <StatCard
                label="Warning"
                value={
                  stationCounts.Warning ||
                  0
                }
                tone="yellow"
                icon={
                  AlertTriangle
                }
              />

              <StatCard
                label="High Risk"
                value={
                  stationCounts[
                    'High Risk'
                  ] || 0
                }
                tone="orange"
                icon={
                  AlertTriangle
                }
              />

              <StatCard
                label="Critical"
                value={
                  stationCounts.Critical ||
                  0
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
                    {
                      activeAnomalies
                    }

                    <small>
                      currently active
                    </small>
                  </strong>
                </div>
              </div>
            </section>

            {error && (
              <div className="insert-error dashboard-api-error">
                <AlertTriangle
                  size={15}
                />

                Backend connection:{' '}
                {error}
              </div>
            )}

            <section className="workspace-grid">
              <div className="center-stage">
                <div className="stage-heading">
                  <div>
                    <span className="section-kicker">
                      NETWORK MAP ·{' '}
                      {parameter.toUpperCase()}{' '}
                      LAYER
                    </span>

                    <h2>
                      Station coverage

                      <span>
                        {' '}
                        ·{' '}
                        {
                          stations.length
                        }{' '}
                        online
                      </span>
                    </h2>
                  </div>

                  <button
                    className={`map-control ${
                      autoRotate &&
                      globeAnimation
                        ? 'on'
                        : 'off'
                    }`}
                    onClick={() =>
                      setAutoRotate(
                        (
                          currentValue
                        ) =>
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
                    ref={
                      globeRef
                    }
                    width={600}
                    height={450}
                    backgroundColor="rgba(0,0,0,0)"
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    showAtmosphere
                    atmosphereColor="#48cbe3"
                    atmosphereAltitude={
                      0.16
                    }
                    pointsData={
                      stations
                    }
                    pointLat="lat"
                    pointLng="lng"
                    pointColor="color"
                    pointsMerge={
                      false
                    }
                    onPointClick={
                      selectStation
                    }
                    pointRadius={(
                      station
                    ) =>
                      0.28 +
                      station.risk /
                        300
                    }
                    pointAltitude={() =>
                      0.03
                    }
                    pointLabel={(
                      station
                    ) => {
                      const value =
                        parameter ===
                        'Temperature'
                          ? station.temp
                          : parameter ===
                              'Humidity'
                            ? station.humidity
                            : parameter ===
                                'Wind'
                              ? station.wind
                              : parameter ===
                                  'Rainfall'
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
                  parameter={
                    parameter
                  }
                  current={
                    current
                  }
                  stations={
                    stations
                  }
                  history={
                    dashboardHistory
                  }
                  historyLoading={
                    dashboardHistoryLoading
                  }
                  historyError={
                    dashboardHistoryError
                  }
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
                  {Object.entries(
                    parameters
                  ).map(
                    ([
                      name,
                      item
                    ]) => {
                      const Icon =
                        item.icon

                      return (
                        <button
                          key={
                            name
                          }
                          className={
                            parameter ===
                            name
                              ? 'selected'
                              : ''
                          }
                          style={{
                            '--accent':
                              item.color
                          }}
                          onClick={() => {
                            setParameter(
                              name
                            )

                            setSelectedStationId(
                              null
                            )
                          }}
                        >
                          <Icon
                            size={
                              18
                            }
                          />

                          <span>
                            {
                              name
                            }
                          </span>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              {criticalAnomalies.length >
                0 && (
                <AnomalyCard
                  anomaly={
                    criticalAnomalies[
                      criticalIndex %
                        criticalAnomalies.length
                    ]
                  }
                  onNext={() =>
                    setCriticalIndex(
                      (
                        index
                      ) =>
                        (index +
                          1) %
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