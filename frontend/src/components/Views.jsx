import { useEffect, useState } from 'react'

import {
  Activity,
  ArrowUpRight,
  Database,
  RefreshCw,
  Server,
  SlidersHorizontal,
  Zap
} from 'lucide-react'

import { StatusPill } from './Shared'
import { parameterUnit, stationValue } from '../utils/helpers'
import { TrendChart, ParameterModal } from './StationDetails'


export function SecondaryView({
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

export function LiveDataView({
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


export function ViewHeader({
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

export function NotificationPanel({
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

export function StationsView({
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

export function AlertsView({
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

export function AnomaliesView({
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

export function HealthView() {

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

export function SettingsView({
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

export function SettingToggle({
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

export function AboutView({
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

export function OverviewPanel({
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

