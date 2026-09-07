// =====================================
// SHARED HELPER / UTILITY FUNCTIONS
// Anomaly parsing, formatting, status derivation
// =====================================

export function normalizeM3(value) {
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

export function getAnomalyDetails(station) {
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

export function getParameters(station) {
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

export function getDetectedValues(station) {
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

export function formatFeatureName(feature) {

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

export function getExpectedValue(station) {

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

export function getTableAnomalyType(station) {

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

export function getAnomalyExplanation(station) {

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

export function getAnomalyTimestamp(station) {

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



export function getDetectedParameter(station, anomaly = {}) {
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



export function getAnomalyType(m2, m3, m4) {
  return m4?.anomaly_type || m3?.anomaly_type || m2?.anomaly_type || 'Weather Anomaly'
}

export function getExplanation(m4, m3, m2) {
  return m4?.explanation || m3?.reason || m3?.explanation || m2?.reason || 'Weather anomaly detected.'
}

export function deriveStatus(m2, m3, m4) {
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
// STATION VALUE + PARAMETER UNIT HELPERS
// =====================================

export function stationValue(
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


export function parameterUnit(name) {

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
