// =====================================
// FALLBACK MOCK STATIONS
// =====================================

export const mockStations = [
  { id: 'AWS_001', city: 'Pune', region: 'Maharashtra', lat: 18.52, lng: 73.86, status: 'Warning', color: '#ffc857', risk: 62, temp: 31.4, humidity: 68, pressure: 1009, wind: 14, rainfall: 2.4, updated: '2 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 92, severity: 'MEDIUM', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_002', city: 'Mumbai', region: 'Maharashtra', lat: 19.07, lng: 72.87, status: 'Healthy', color: '#55d6a3', risk: 24, temp: 29.8, humidity: 78, pressure: 1011, wind: 19, rainfall: 4.8, updated: '1 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 96, severity: 'LOW', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_003', city: 'Nashik', region: 'Maharashtra', lat: 20.01, lng: 73.78, status: 'Critical', color: '#ff6b5f', risk: 92, temp: 39.6, humidity: 42, pressure: 997, wind: 31, rainfall: 0, updated: '4 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 61, severity: 'CRITICAL', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_004', city: 'Delhi', region: 'NCT Delhi', lat: 28.61, lng: 77.21, status: 'High Risk', color: '#ff9955', risk: 74, temp: 35.2, humidity: 54, pressure: 1004, wind: 22, rainfall: 0.8, updated: '3 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 76, severity: 'VERY HIGH', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_005', city: 'Bengaluru', region: 'Karnataka', lat: 12.97, lng: 77.59, status: 'Healthy', color: '#55d6a3', risk: 18, temp: 24.7, humidity: 74, pressure: 1014, wind: 11, rainfall: 6.2, updated: '1 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 98, severity: 'LOW', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_006', city: 'Kolkata', region: 'West Bengal', lat: 22.57, lng: 88.36, status: 'Warning', color: '#ffc857', risk: 58, temp: 30.9, humidity: 81, pressure: 1008, wind: 17, rainfall: 8.9, updated: '5 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 88, severity: 'MEDIUM', explanation: 'Fallback demonstration station.' },
  { id: 'AWS_007', city: 'Jaipur', region: 'Rajasthan', lat: 26.91, lng: 75.78, status: 'Healthy', color: '#55d6a3', risk: 27, temp: 37.1, humidity: 31, pressure: 1002, wind: 26, rainfall: 0, updated: '2 min ago', m2: {}, m3: [], m4: {}, sensorHealth: 94, severity: 'LOW', explanation: 'Fallback demonstration station.' }
]

export const fallbackStations = mockStations.map((station) => ({
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
