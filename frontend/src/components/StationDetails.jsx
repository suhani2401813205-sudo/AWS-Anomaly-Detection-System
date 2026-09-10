import React, { useState } from 'react'

import {
  Activity,
  CloudRain,
  CloudSun,
  Gauge,
  Thermometer,
  Wind,
  X
} from 'lucide-react'

import { StatusPill } from './Shared'
import { normalizeM3, parameterUnit } from '../utils/helpers'


export function StationDetailsView({
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


          {/* STATUS + ISSUE */}

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



          {/* ANOMALY DETAILS */}

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



          {/* EXPLANATION */}

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
          FEATURE / PARAMETER HEALTH
          ================================================= */}

      <section className="station-details-card">

        <div className="station-details-card-heading">

          <div>

            <span className="section-kicker">
              FEATURE HEALTH
            </span>

            <h3>
              Parameter health status
            </h3>

          </div>

        </div>


        <FeatureHealthTable
          featureHealth={
            m4?.feature_health ||
            station?.featureHealth ||
            {}
          }
          weatherData={
            station?.weatherData ||
            {}
          }
          history={history}
          m3Items={m3Items}
        />

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


          /* HISTORICAL EVENT */

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


          /* CURRENT ANOMALY IF NO HISTORY */

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


          /* NO ALERT */

          <div className="station-history-empty">

            No recent alerts.

          </div>

        )}

      </section>

    </div>
  );
}


/* =====================================================
   TREND CHART
   ===================================================== */

export function TrendChart({
  title,
  unit,
  history,
  valueKey,
  group
}) {

  const points = history
    .map((entry, index) => ({
      timestamp: entry.timestamp,
      value: Number(
        group
          ? entry[group]?.[valueKey]
          : entry.weather_data?.[valueKey]
      )
    }))
    .filter(
      (point) =>
        Number.isFinite(point.value)
    )
    .map(
      (point, index) => ({
        ...point,
        index
      })
    )

  if (!points.length) {

    return (

      <div className="trend-card trend-empty">

        <strong>
          {title}
        </strong>

        <span>
          No historical data
        </span>

      </div>

    )
  }

  const width = 320
  const height = 130

  const padding = {
    top: 16,
    right: 12,
    bottom: 28,
    left: 34
  }

  const min = Math.min(
    ...points.map(
      (point) =>
        point.value
    )
  )

  const max = Math.max(
    ...points.map(
      (point) =>
        point.value
    )
  )

  const spread =
    max - min || 1

  const x = (index) =>
    padding.left +
    (
      index /
      Math.max(
        points.length - 1,
        1
      )
    ) *
    (
      width -
      padding.left -
      padding.right
    )

  const y = (value) =>
    padding.top +
    (
      1 -
      (
        value - min
      ) /
      spread
    ) *
    (
      height -
      padding.top -
      padding.bottom
    )

  const line =
    points
      .map(
        (point) =>
          `${x(point.index)},${y(point.value)}`
      )
      .join(' ')

  return (

    <div className="trend-card">

      <div className="trend-card-heading">

        <strong>
          {title}
        </strong>

        <span>
          {unit}
        </span>

      </div>

      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title} trend`}
      >

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          className="trend-axis"
        />

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          className="trend-axis"
        />

        <polyline
          points={line}
          className="trend-line"
        />

        {points.map(
          (point) => (

            <circle
              key={`${point.timestamp}-${point.index}`}
              cx={x(point.index)}
              cy={y(point.value)}
              r="3"
              className="trend-point"
            >

              <title>
                {`${new Date(
                  point.timestamp
                ).toLocaleString()} · ${
                  point.value
                }${unit}`}
              </title>

            </circle>

          )
        )}

        <text
          x={padding.left}
          y={height - 8}
          className="trend-label"
        >
          {new Date(
            points[0].timestamp
          ).toLocaleTimeString()}
        </text>

        <text
          x={width - padding.right}
          y={height - 8}
          textAnchor="end"
          className="trend-label"
        >
          {new Date(
            points[points.length - 1].timestamp
          ).toLocaleTimeString()}
        </text>

        <text
          x="4"
          y={padding.top + 4}
          className="trend-label"
        >
          {max}
        </text>

        <text
          x="4"
          y={height - padding.bottom}
          className="trend-label"
        >
          {min}
        </text>

      </svg>

    </div>

  )
}


/* =====================================================
   STATION EVENTS
   ===================================================== */

export function StationEvents({
  history
}) {

  const events =
    history.flatMap(
      (entry) => (

        normalizeM3(
          entry.m3
        )
          .filter(
            (event) =>
              event.anomaly
          )
          .map(
            (event) => ({
              ...event,
              timestamp:
                event.timestamp ||
                entry.timestamp
            })
          )

      )
    )

  if (!events.length) {

    return (
      <div className="station-history-empty">
        No station events available.
      </div>
    )
  }

  return (

    <div className="station-events-list">

      {events.map(
        (event, index) => (

          <div
            className="station-event"
            key={`${event.timestamp}-${index}`}
          >

            <span>
              {event.timestamp}
            </span>

            <strong>
              {event.anomaly_type ||
                event.feature}
            </strong>

            <p>
              {event.reason ||
                event.value}
            </p>

          </div>

        )
      )}

    </div>
  )
}


/* =====================================================
   HEALTH BAR
   ===================================================== */

export function HealthBar({
  value
}) {

  const numericValue =
    Number(value)

  const hasValue =
    Number.isFinite(
      numericValue
    )

  return (

    <div className="health-bar">

      <div className="health-bar-track">

        {hasValue && (

          <span
            style={{
              width:
                `${Math.max(
                  0,
                  Math.min(
                    100,
                    numericValue
                  )
                )}%`
            }}
          />

        )}

      </div>

      <strong>
        {hasValue
          ? numericValue
          : ''}
      </strong>

      <small>
        Health Score
      </small>

    </div>
  )
}


/* =====================================================
   READING
   ===================================================== */

export function Reading({
  label,
  value
}) {

  const weatherDisplay = {

    temperature: [
      'Temperature',
      Thermometer,
      '°C'
    ],

    humidity: [
      'Humidity',
      CloudSun,
      '%'
    ],

    pressure: [
      'Pressure',
      Gauge,
      'hPa'
    ],

    wind_speed: [
      'Wind Speed',
      Wind,
      'km/h'
    ],

    rainfall: [
      'Rainfall',
      CloudRain,
      'mm'
    ]

  }

  const [
    displayLabel,
    Icon,
    unit
  ] =
    weatherDisplay[label] ||
    [
      label,
      Activity,
      ''
    ]

  return (

    <div className="reading">

      <Icon size={15} />

      <div>

        <span>
          {displayLabel}
        </span>

        <strong>
          {value}
          {unit}
        </strong>

      </div>

    </div>
  )
}


/* =====================================================
   DETAIL FIELD
   ===================================================== */

export function DetailField({
  label,
  value
}) {

  const displayValue =
    value !== null &&
    typeof value === 'object'

      ? Object.entries(
          value
        )
          .map(
            ([key, item]) =>
              `${key}: ${item}`
          )
          .join(' · ')

      : String(value)

  return (

    <div className="detail-field">

      <span>
        {label}
      </span>

      <strong>
        {displayValue}
      </strong>

    </div>
  )
}


/* =====================================================
   FEATURE / PARAMETER HEALTH TABLE
   ===================================================== */

const featureMeta = {

  temperature: {
    label: 'Temperature',
    unit: '°C',
    Icon: Thermometer
  },

  humidity: {
    label: 'Humidity',
    unit: '%',
    Icon: CloudSun
  },

  pressure: {
    label: 'Pressure',
    unit: 'hPa',
    Icon: Gauge
  },

  wind_speed: {
    label: 'Wind Speed',
    unit: 'km/h',
    Icon: Wind
  },

  rainfall: {
    label: 'Rainfall',
    unit: 'mm',
    Icon: CloudRain
  }

}


/* =====================================================
   FORMAT CURRENT READING
   ===================================================== */

function formatFeatureReading(
  value,
  unit
) {

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(
      Number(value)
    )
  ) {

    return '—'

  }

  return `${
    Number(value).toFixed(2)
  }${unit}`
}


/* =====================================================
   FORMAT HEALTH
   ===================================================== */

function formatHealthScore(
  value
) {

  if (
    !Number.isFinite(
      Number(value)
    )
  ) {

    return '—'

  }

  return `${Math.round(
    Math.max(
      0,
      Math.min(
        100,
        Number(value)
      )
    )
  )}%`
}


/* =====================================================
   FEATURE STATUS
   ===================================================== */

function getFeatureStatus(
  health,
  hasAnomaly
) {

  if (hasAnomaly) {
    return 'Anomaly'
  }

  if (health >= 80) {
    return 'Healthy'
  }

  if (health >= 50) {
    return 'Warning'
  }

  return 'Critical'
}


/* =====================================================
   OBSERVED RANGE
   ===================================================== */

function getObservedRange(
  history,
  feature,
  unit
) {

  const values =
    history
      .map(
        (entry) =>
          entry?.weather_data?.[feature]
      )
      .map(Number)
      .filter(
        Number.isFinite
      )

  if (!values.length) {
    return '—'
  }

  const min =
    Math.min(...values)

  const max =
    Math.max(...values)

  return `${
    min.toFixed(2)
  }${unit} – ${
    max.toFixed(2)
  }${unit}`
}


/* =====================================================
   ACTIVE ANOMALY FOR FEATURE
   ===================================================== */

function featureHasActiveAnomaly(
  feature,
  m3Items = []
) {

  return m3Items.some(
    (item) =>
      item?.anomaly === true &&
      item?.feature === feature
  )
}


/* =====================================================
   FEATURE HEALTH TABLE
   ===================================================== */

export function FeatureHealthTable({
  featureHealth,
  weatherData,
  history = [],
  m3Items = []
}) {

  const entries =
    Object.entries(
      featureHealth || {}
    ).filter(
      ([feature]) =>
        featureMeta[feature]
    )


  if (!entries.length) {

    return (

      <div className="feature-health-empty">

        Waiting for the next live
        M4 feature-health result.

      </div>

    )
  }


  return (

    <div className="feature-health-table-wrap">


      {/* TABLE HEADER */}

      <div
        className="feature-health-table feature-health-header"
        aria-hidden="true"
      >

        <span>
          Parameter
        </span>

        <span>
          Current value
        </span>

        <span>
          Expected range
        </span>

        <span>
          Health
        </span>

        <span>
          Status
        </span>

      </div>



      {/* TABLE ROWS */}

      <div className="feature-health-table">

        {entries.map(
          ([feature, health]) => (

            <FeatureHealthRow
              key={feature}
              feature={feature}
              health={health}
              currentValue={
                weatherData?.[feature]
              }
              history={history}
              m3Items={m3Items}
            />

          )
        )}

      </div>

    </div>
  )
}


/* =====================================================
   FEATURE HEALTH ROW
   ===================================================== */

export function FeatureHealthRow({
  feature,
  health,
  currentValue,
  history,
  m3Items
}) {

  const {
    label,
    unit,
    Icon
  } =
    featureMeta[feature]


  const rawHealth =
    health?.value ??
    health


  const numericHealth =
    rawHealth === null ||
    rawHealth === undefined ||
    rawHealth === ''
      ? NaN
      : Number(rawHealth)


  const hasHealth =
    Number.isFinite(
      numericHealth
    )


  const boundedHealth =
    Math.max(
      0,
      Math.min(
        100,
        numericHealth
      )
    )


  const hasAnomaly =
    featureHasActiveAnomaly(
      feature,
      m3Items
    )


  const status =
    hasHealth
      ? getFeatureStatus(
          boundedHealth,
          hasAnomaly
        )
      : 'Awaiting data'


  return (

    <div
      className="feature-health-row"
      data-feature={feature}
    >


      {/* PARAMETER */}

      <div className="feature-health-label">

        <Icon size={17} />

        <span>
          {label}
        </span>

      </div>



      {/* CURRENT VALUE */}

      <span className="feature-health-current">

        {formatFeatureReading(
          currentValue,
          unit
        )}

      </span>



      {/* EXPECTED RANGE */}

      <span className="feature-health-range">

        {getObservedRange(
          history,
          feature,
          unit
        )}

      </span>



      {/* HEALTH */}

      <div className="feature-health-score">

        <span>

          {formatHealthScore(
            boundedHealth
          )}

        </span>


        <div className="feature-health-track">

          {hasHealth && (

            <i
              style={{
                width:
                  `${boundedHealth}%`
              }}
            />

          )}

        </div>

      </div>



      {/* STATUS */}

      <span
        className={`feature-health-status ${
          status
            .toLowerCase()
            .replaceAll(
              ' ',
              '-'
            )
        }`}
      >

        <i />

        {status}

      </span>

    </div>
  )
}


/* =====================================================
   ANOMALY CARD
   ===================================================== */

export function AnomalyCard({
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


/* =====================================================
   PARAMETER MODAL
   ===================================================== */

export function ParameterModal({
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
          {parameterUnit(
            parameter
          )}

        </strong>

        <StatusPill
          status={station.status}
        />

      </div>

    </div>
  )
}