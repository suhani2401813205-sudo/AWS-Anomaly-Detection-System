import pandas as pd
from datetime import datetime

from rule_engine import analyze_weather_data
from m4_processor import process_row

from fastapi import FastAPI
from pydantic import BaseModel

import joblib
import numpy as np
import requests

from fastapi.middleware.cors import CORSMiddleware


# =====================================
# CONFIGURATION
# =====================================

MAX_HISTORY = 100
MAX_PREDICTION_HISTORY = 100

# Demo mode only identifies this API as a demo.
# It does NOT override M2 or M3 results.
DEMO_MODE = True


# =====================================
# STORE DATA SEPARATELY FOR EACH STATION
# =====================================

station_states = {}


def get_station_state(station_id):

    if station_id not in station_states:

        station_states[station_id] = {

            "weather_history": [],
            "prediction_history": [],
            "overall_health": 100.0,

            "feature_health": {
                "temperature": 100.0,
                "humidity": 100.0,
                "pressure": 100.0,
                "wind_speed": 100.0,
                "rainfall": 100.0
            },

            # Stores the latest timestamp received
            # from Open-Meteo API
            "last_api_timestamp": None
        }

    return station_states[station_id]


# =====================================
# WEATHER STATIONS
# =====================================

STATIONS = [

    {
        "id": "AWS_001",
        "city": "Pune",
        "region": "Maharashtra",
        "latitude": 18.52,
        "longitude": 73.86
    },

    {
        "id": "AWS_002",
        "city": "Mumbai",
        "region": "Maharashtra",
        "latitude": 19.07,
        "longitude": 72.87
    },

    {
        "id": "AWS_003",
        "city": "Nashik",
        "region": "Maharashtra",
        "latitude": 20.01,
        "longitude": 73.78
    },

    {
        "id": "AWS_004",
        "city": "Delhi",
        "region": "NCT Delhi",
        "latitude": 28.61,
        "longitude": 77.21
    },

    {
        "id": "AWS_005",
        "city": "Bengaluru",
        "region": "Karnataka",
        "latitude": 12.97,
        "longitude": 77.59
    },

    {
        "id": "AWS_006",
        "city": "Kolkata",
        "region": "West Bengal",
        "latitude": 22.57,
        "longitude": 88.36
    },

    {
        "id": "AWS_007",
        "city": "Jaipur",
        "region": "Rajasthan",
        "latitude": 26.91,
        "longitude": 75.78
    }
]


# =====================================
# FASTAPI APP
# =====================================

app = FastAPI(

    title="AWS Anomaly Detection API - Demo",

    description=(
        "Weather station anomaly detection using "
        "Open-Meteo + Isolation Forest + "
        "Rule Engine + Risk Analysis"
    ),

    version="2.0.0-demo"
)


# =====================================
# CORS CONFIGURATION
# =====================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

        "http://localhost:5174",

        "http://127.0.0.1:5174"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =====================================
# LOAD ISOLATION FOREST MODEL
# =====================================

model = joblib.load(
    "models/isolation_forest_model.pkl"
)


scaler = joblib.load(
    "models/scaler.pkl"
)


# =====================================
# INPUT DATA MODEL
# =====================================

class WeatherData(BaseModel):

    pressure: float

    temperature: float

    humidity: float

    wind_speed: float

    rainfall: float


# =====================================
# HOME API
# =====================================

@app.get("/")
def home():

    return {

        "message":
            "AWS Anomaly Detection Demo API is running",

        "status":
            "online",

        "mode":
            "manual + live",

        "pipeline":
            "M2 Isolation Forest → M3 Rule Engine → M4 Risk Analysis",

        "manual_testing":
            True,

        "total_stations":
            len(STATIONS)
    }


# =====================================
# HEALTH CHECK API
# =====================================

@app.get("/health")
def health_check():

    return {

        "status":
            "healthy",

        "service":
            "AWS Anomaly Detection API",

        "mode":
            "manual + live",

        "model_loaded":
            True,

        "total_stations":
            len(STATIONS),

        "active_station_states":
            len(station_states),

        "timestamp":
            str(datetime.now())
    }


# =====================================
# FIND STATION
# =====================================

def station_exists(station_id):

    return any(

        station["id"] == station_id

        for station in STATIONS
    )


# =====================================
# MAIN ANOMALY DETECTION PIPELINE
#
# M2 → M3 → M4
# =====================================

def run_anomaly_pipeline(

    data: WeatherData,

    station_id: str

):

    # =====================================
    # VALIDATE STATION
    # =====================================

    if not station_exists(station_id):

        raise ValueError(

            f"Unknown station ID: {station_id}"
        )


    # =====================================
    # GET STATION STATE
    # =====================================

    state = get_station_state(

        station_id
    )

    weather_history = state[
        "weather_history"
    ]

    prediction_history = state[
        "prediction_history"
    ]

    overall_health = state[
        "overall_health"
    ]

    feature_health = state[
        "feature_health"
    ]


    # =====================================
    # CURRENT TIMESTAMP
    # =====================================

    current_timestamp = datetime.now()


    # =====================================
    # M2
    # ISOLATION FOREST
    # =====================================

    input_data = np.array([

        [

            data.temperature,

            data.humidity,

            data.pressure,

            data.wind_speed,

            data.rainfall
        ]

    ])


    # Scale input using the trained scaler
    scaled_data = scaler.transform(

        input_data
    )


    # Isolation Forest prediction
    prediction = model.predict(

        scaled_data
    )[0]


    # Isolation Forest decision score
    anomaly_score = model.decision_function(

        scaled_data
    )[0]


    # Convert sklearn output
    #
    # -1 = anomaly
    #  1 = normal
    ml_prediction = (

        1

        if prediction == -1

        else 0
    )


    ml_status = (

        "Anomaly"

        if prediction == -1

        else "Normal"
    )


    # =====================================
    # CURRENT WEATHER READING
    # =====================================

    current_reading = {

        "timestamp":
            current_timestamp,

        "temperature":
            data.temperature,

        "humidity":
            data.humidity,

        "pressure":
            data.pressure,

        "wind_speed":
            data.wind_speed,

        "rainfall":
            data.rainfall
    }


    # =====================================
    # STORE WEATHER HISTORY
    # =====================================

    weather_history.append(

        current_reading
    )


    if len(weather_history) > MAX_HISTORY:

        weather_history.pop(0)


    # =====================================
    # M3
    # RULE ENGINE
    # =====================================

    history_df = pd.DataFrame(

        weather_history
    )


    m3_results = analyze_weather_data(

        history_df
    )


    # =====================================
    # M3 DEBUG
    # =====================================

    print("\n")

    print(
        "========================================"
    )

    print(
        f"M3 DEBUG - {station_id}"
    )

    print(
        "========================================"
    )

    print(
        "\nLatest weather readings:"
    )

    print(

        history_df.tail(5).to_string(

            index=False
        )
    )

    print(
        "\nM3 Results:"
    )


    if not m3_results:

        print(
            "No M3 rule-based anomaly detected."
        )

    else:

        for result in m3_results:

            print(

                f"Type: {result.anomaly_type} | "

                f"Feature: {result.feature} | "

                f"Value: {result.value} | "

                f"Timestamp: {result.timestamp}"
            )

            print(

                f"Reason: {result.reason}"
            )


    print(
        "========================================"
    )

    print("\n")


    # =====================================
    # GET CURRENT M3 RESULTS
    # =====================================

    current_m3_results = []

    rule_anomaly = False

    rule_anomaly_types = []

    rule_features = []

    rule_reasons = []


    # =====================================
    # SAFE TIMESTAMP MATCHING
    # =====================================

    current_timestamp_pd = pd.to_datetime(

        current_timestamp
    )


    for result in m3_results:

        if result.timestamp is None:

            continue


        result_timestamp = pd.to_datetime(

            result.timestamp
        )


        timestamp_difference = abs(

            (

                result_timestamp

                - current_timestamp_pd

            ).total_seconds()
        )


        timestamp_match = (

            timestamp_difference < 0.001
        )


        if timestamp_match:

            current_m3_results.append({

                "anomaly":
                    result.anomaly,

                "anomaly_type":
                    result.anomaly_type,

                "feature":
                    result.feature,

                "value":
                    result.value,

                "timestamp":
                    str(result.timestamp),

                "reason":
                    result.reason
            })


            if result.anomaly:

                rule_anomaly = True


                rule_anomaly_types.append(

                    result.anomaly_type
                )


                if result.feature is not None:

                    if isinstance(

                        result.feature,

                        list
                    ):

                        rule_features.extend(

                            result.feature
                        )

                    else:

                        rule_features.append(

                            result.feature
                        )


                if result.reason:

                    rule_reasons.append(

                        result.reason
                    )


    # =====================================
    # FALLBACK
    #
    # If exact timestamp matching fails,
    # use latest M3 result.
    # =====================================

    if (

        not current_m3_results

        and m3_results

    ):

        valid_results = [

            result

            for result in m3_results

            if result.timestamp is not None
        ]


        if valid_results:

            latest_timestamp = max(

                pd.to_datetime(

                    result.timestamp
                )

                for result in valid_results
            )


            for result in valid_results:

                result_timestamp = pd.to_datetime(

                    result.timestamp
                )


                if (

                    result_timestamp

                    == latest_timestamp

                ):

                    current_m3_results.append({

                        "anomaly":
                            result.anomaly,

                        "anomaly_type":
                            result.anomaly_type,

                        "feature":
                            result.feature,

                        "value":
                            result.value,

                        "timestamp":
                            str(result.timestamp),

                        "reason":
                            result.reason
                    })


                    if result.anomaly:

                        rule_anomaly = True


                        rule_anomaly_types.append(

                            result.anomaly_type
                        )


                        if result.feature is not None:

                            if isinstance(

                                result.feature,

                                list
                            ):

                                rule_features.extend(

                                    result.feature
                                )

                            else:

                                rule_features.append(

                                    result.feature
                                )


                        if result.reason:

                            rule_reasons.append(

                                result.reason
                            )


    # =====================================
    # REMOVE DUPLICATES
    # =====================================

    rule_anomaly_types = list(

        dict.fromkeys(

            rule_anomaly_types
        )
    )


    rule_features = list(

        dict.fromkeys(

            str(feature)

            for feature in rule_features
        )
    )


    rule_reasons = list(

        dict.fromkeys(

            rule_reasons
        )
    )


    # =====================================
    # PREPARE M2 + M3 DATA FOR M4
    # =====================================

    m4_input = {

        "timestamp":
            current_timestamp,

        "temperature":
            data.temperature,

        "humidity":
            data.humidity,

        "pressure":
            data.pressure,

        "wind_speed":
            data.wind_speed,

        "rainfall":
            data.rainfall,


        # =================================
        # M2 OUTPUT
        # =================================

        "ml_prediction":
            ml_prediction,

        "ml_status":
            ml_status,

        "anomaly_score":
            float(anomaly_score),


        # =================================
        # M3 OUTPUT
        # =================================

        "rule_anomaly":
            rule_anomaly,

        "rule_anomaly_type":

            (

                ", ".join(

                    rule_anomaly_types
                )

                if rule_anomaly_types

                else "NORMAL"
            ),

        "rule_feature":

            (

                ", ".join(

                    rule_features
                )

                if rule_features

                else None
            ),

        "rule_reason":

            (

                " | ".join(

                    rule_reasons
                )

                if rule_reasons

                else ""
            )
    }


    # =====================================
    # M4
    # RISK + EXPLANATION + HEALTH
    # =====================================

    m4_result = process_row(

        row=m4_input,

        previous_station_health=
            overall_health,

        previous_feature_health=
            feature_health
    )


    # =====================================
    # UPDATE STATION HEALTH
    # =====================================

    state["overall_health"] = (

        m4_result["station_health"]
    )


    state["feature_health"] = (

        m4_result["feature_health"]
    )


    # =====================================
    # FINAL RESULT
    # =====================================

    final_result = {

        "timestamp":
            str(current_timestamp),


        # =================================
        # WEATHER DATA
        # =================================

        "weather_data": {

            "temperature":
                data.temperature,

            "humidity":
                data.humidity,

            "pressure":
                data.pressure,

            "wind_speed":
                data.wind_speed,

            "rainfall":
                data.rainfall
        },


        # =================================
        # M2 OUTPUT
        # =================================

        "m2": {

            "ml_prediction":
                ml_prediction,

            "ml_status":
                ml_status,

            "anomaly_score":
                float(anomaly_score)
        },


        # =================================
        # M3 OUTPUT
        # =================================

        "m3": {

            "anomaly":
                rule_anomaly,

            "anomaly_type":

                (

                    ", ".join(

                        rule_anomaly_types
                    )

                    if rule_anomaly_types

                    else "NORMAL"
                ),

            "feature":

                (

                    ", ".join(

                        rule_features
                    )

                    if rule_features

                    else None
                ),

            "reason":

                (

                    " | ".join(

                        rule_reasons
                    )

                    if rule_reasons

                    else
                        "No rule-based anomaly detected"
                ),

            "details":
                current_m3_results
        },


        # =================================
        # M4 OUTPUT
        # =================================

        "m4": {

            "risk_score":
                m4_result["risk_score"],

            "confidence":
                m4_result["confidence"],

            "severity":
                m4_result["severity"],

            "explanation":
                m4_result["explanation"],

            "sensor_health":
                m4_result["station_health"],

            "feature_health":
                m4_result["feature_health"]
        },


        "history_size":
            len(weather_history)
    }


    # =====================================
    # STORE PREDICTION HISTORY
    # =====================================

    prediction_history.append(

        final_result
    )


    if (

        len(prediction_history)

        > MAX_PREDICTION_HISTORY

    ):

        prediction_history.pop(0)


    return final_result


# =====================================
# MANUAL PREDICTION API
# =====================================

@app.post("/predict/{station_id}")
def predict_anomaly(

    station_id: str,

    data: WeatherData

):

    return run_anomaly_pipeline(

        data=data,

        station_id=station_id
    )


# =====================================
# LIVE WEATHER + ANOMALY DETECTION API
#
# IMPORTANT:
# No automatic demo anomaly injection.
#
# Live API uses actual Open-Meteo values.
# =====================================

@app.get("/predict/live")
def predict_live():

    results = []


    # =====================================
    # PROCESS EACH WEATHER STATION
    # =====================================

    for station in STATIONS:

        try:

            station_id = station["id"]


            # =================================
            # GET STATION STATE
            # =================================

            state = get_station_state(

                station_id
            )


            latitude = station[
                "latitude"
            ]

            longitude = station[
                "longitude"
            ]


            # =================================
            # OPEN-METEO API
            # =================================

            url = (

                "https://api.open-meteo.com/v1/forecast"

                f"?latitude={latitude}"

                f"&longitude={longitude}"

                "&current="

                "temperature_2m,"

                "relative_humidity_2m,"

                "surface_pressure,"

                "wind_speed_10m,"

                "precipitation"
            )


            response = requests.get(

                url,

                timeout=10
            )


            response.raise_for_status()


            weather_response = response.json()


            current = weather_response.get(

                "current",

                {}
            )


            # =================================
            # GET OPEN-METEO TIMESTAMP
            # =================================

            api_timestamp = current.get("time")


            # =================================
            # AVOID DUPLICATE LIVE READINGS
            #
            # Open-Meteo can return the same
            # current timestamp for multiple
            # frontend polling requests.
            #
            # Do NOT run M2 → M3 → M4 again
            # for the same API reading.
            # =================================

            if (

                api_timestamp is not None

                and state.get(
                    "last_api_timestamp"
                ) == api_timestamp

            ):

                print(

                    f"[LIVE] Duplicate reading "
                    f"skipped for {station_id}: "
                    f"{api_timestamp}"
                )


                # =================================
                # RETURN PREVIOUS PREDICTION
                #
                # This keeps the station visible
                # in the dashboard.
                # =================================

                if state["prediction_history"]:

                    prediction = (

                        state[
                            "prediction_history"
                        ][-1]
                    )


                    results.append({

                        "station":
                            station,

                        "weather_data":
                            prediction[
                                "weather_data"
                            ],

                        "m2":
                            prediction[
                                "m2"
                            ],

                        "m3":
                            prediction[
                                "m3"
                            ],

                        "m4":
                            prediction[
                                "m4"
                            ],

                        "timestamp":
                            prediction[
                                "timestamp"
                            ],

                        "duplicate":
                            True
                    })


                    continue


                # If there is no previous prediction,
                # allow this reading to be processed.


            # =================================
            # SAVE NEW API TIMESTAMP
            # =================================

            if api_timestamp is not None:

                state[
                    "last_api_timestamp"
                ] = api_timestamp


            # =================================
            # LIVE WEATHER VALUES
            # =================================

            weather_values = {

                "temperature":

                    float(

                        current.get(

                            "temperature_2m",

                            0
                        )
                    ),

                "humidity":

                    float(

                        current.get(

                            "relative_humidity_2m",

                            0
                        )
                    ),

                "pressure":

                    float(

                        current.get(

                            "surface_pressure",

                            0
                        )
                    ),

                "wind_speed":

                    float(

                        current.get(

                            "wind_speed_10m",

                            0
                        )
                    ),

                "rainfall":

                    float(

                        current.get(

                            "precipitation",

                            0
                        )
                    )
            }


            # =================================
            # PRINT LIVE DATA
            # =================================

            print(

                f"[LIVE] Final weather data "
                f"for {station_id}: "
                f"{weather_values}"
            )


            # =================================
            # CREATE WEATHER DATA OBJECT
            # =================================

            weather_data = WeatherData(

                temperature=
                    weather_values[
                        "temperature"
                    ],

                humidity=
                    weather_values[
                        "humidity"
                    ],

                pressure=
                    weather_values[
                        "pressure"
                    ],

                wind_speed=
                    weather_values[
                        "wind_speed"
                    ],

                rainfall=
                    weather_values[
                        "rainfall"
                    ]
            )


            # =================================
            # RUN M2 → M3 → M4
            # =================================

            prediction = run_anomaly_pipeline(

                data=weather_data,

                station_id=station_id
            )


            # =================================
            # ADD STATION INFORMATION
            # =================================

            results.append({

                "station":
                    station,

                "weather_data":
                    prediction[
                        "weather_data"
                    ],

                "m2":
                    prediction[
                        "m2"
                    ],

                "m3":
                    prediction[
                        "m3"
                    ],

                "m4":
                    prediction[
                        "m4"
                    ],

                "timestamp":
                    prediction[
                        "timestamp"
                    ],

                "duplicate":
                    False
            })


        except Exception as e:

            print(

                f"Error processing "
                f"{station['id']}: "
                f"{str(e)}"
            )


            results.append({

                "station":
                    station,

                "error":
                    str(e)
            })


    # =====================================
    # FINAL LIVE RESPONSE
    # =====================================

    return {

        "status":
            "success",

        "mode":
            "live",

        "total_stations":
            len(STATIONS),

        "stations":
            results,

        "timestamp":
            str(datetime.now())
    }


# =====================================
# RESET ONE STATION
#
# Useful before every manual anomaly test
# =====================================

@app.post("/demo/reset/{station_id}")
def reset_station(

    station_id: str

):

    if not station_exists(station_id):

        return {

            "status":
                "error",

            "message":
                f"Unknown station ID: {station_id}"
        }


    station_states[station_id] = {

        "weather_history": [],

        "prediction_history": [],

        "overall_health": 100.0,

        "feature_health": {

            "temperature": 100.0,
            "humidity": 100.0,
            "pressure": 100.0,
            "wind_speed": 100.0,
            "rainfall": 100.0
        },

        # IMPORTANT:
        # Reset Open-Meteo timestamp also
        "last_api_timestamp": None
    }


    return {

        "status":
            "success",

        "station_id":
            station_id,

        "message":
            "Station history, health and live timestamp reset successfully"
    }


# =====================================
# RESET ALL STATIONS
# =====================================

@app.post("/demo/reset-all")
def reset_all_stations():

    station_states.clear()


    return {

        "status":
            "success",

        "message":
            "All station histories and health values reset successfully",

        "total_stations":
            len(STATIONS)
    }


# =====================================
# GET HISTORY OF ONE STATION
# =====================================

@app.get("/history/{station_id}")
def get_history(

    station_id: str

):

    state = get_station_state(

        station_id
    )


    return {

        "station_id":
            station_id,

        "count":

            len(

                state[
                    "prediction_history"
                ]
            ),

        "data":

            state[
                "prediction_history"
            ]
    }


# =====================================
# GET SYSTEM STATUS
# =====================================

@app.get("/system/status")
def get_system_status():

    station_status = {}


    for station_id, state in station_states.items():

        latest_result = (

            state[
                "prediction_history"
            ][-1]

            if state[
                "prediction_history"
            ]

            else None
        )


        station_status[station_id] = {

            "weather_history_size":

                len(

                    state[
                        "weather_history"
                    ]
                ),

            "prediction_history_size":

                len(

                    state[
                        "prediction_history"
                    ]
                ),

            "sensor_health":

                state[
                    "overall_health"
                ],

            "feature_health":

                state[
                    "feature_health"
                ],

            "last_api_timestamp":

                state[
                    "last_api_timestamp"
                ],

            "latest_result":

                latest_result
        }


    return {

        "backend_status":
            "online",

        "mode":
            "manual + live",

        "model_status":
            "loaded",

        "total_stations":
            len(STATIONS),

        "active_station_states":
            len(station_states),

        "stations":
            station_status
    }