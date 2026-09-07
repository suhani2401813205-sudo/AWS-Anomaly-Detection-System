import {
  Bell,
  CircleHelp,
  CloudRain,
  CloudSun,
  Gauge,
  Globe2,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Thermometer,
  Wind,
  Zap
} from 'lucide-react'

// =====================================
// PARAMETERS
// =====================================

export const parameters = {
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


export const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Live Data', Radio],
  ['Stations', Globe2],
  ['Alerts', Bell],
  ['Anomalies', Zap],
  ['System Health', ShieldCheck],
  ['Settings', Settings],
  ['About', CircleHelp]
]
