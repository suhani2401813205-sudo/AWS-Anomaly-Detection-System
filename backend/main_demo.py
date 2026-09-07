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


# =====================================
# DEMO MODE
# =====================================

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
            }
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
# CONTROLLED DEMO ANOMALIES
# =====================================

DEMO_ANOMALIES = {

    # Healthy
    "AWS_001": {},

    # Healthy
    "AWS_002": {},

    # SPIKE
    "AWS_003": {
        "wind_speed": 140
    },

    # Healthy
    "AWS_004": {},

    # FROZEN VALUE
    "AWS_005": {
        "temperature": 30
    },

    # Healthy
    "AWS_006": {},

    # Healthy
    "AWS_007": {}
}


# =====================================
# DEMO ANOMALY STATIONS
# =====================================

DEMO_ANOMALY_STATIONS = {

    "AWS_003",
    "AWS_005"
}


# =====================================
# FASTAPI APP
# =====================================

app = FastAPI(

    title="AWS Anomaly Detection API - Demo",

    description=(
        "Demo anomaly detection using "
        "Open-Meteo + Isolation Forest + "
        "Rule Engine + Risk Analysis"
    ),

    version="1.0.0-demo"
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
            "demo",

        "demo_anomalies": {

            "AWS_003":
                "SPIKE - wind speed",

            "AWS_005":
                "FROZEN_VALUE - temperature"
        }
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
            "AWS Anomaly Detection Demo API",

        "mode":
            "demo",

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
# MAIN ANOMALY DETECTION PIPELINE
# M2 → M3 → M4
# =====================================

def run_anomaly_pipeline(

    data: WeatherData,

    station_id: str

):

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


    scaled_data = scaler.transform(

        input_data
    )


    prediction = model.predict(

        scaled_data
    )[0]


    anomaly_score = model.decision_function(

        scaled_data
    )[0]


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
    # DEMO MODE
    #
    # Only AWS_003 and AWS_005
    # are allowed to become anomalies.
    #
    # This prevents random M2/M3 results
    # from other healthy stations during demo.
    # =====================================

    if (

        DEMO_MODE

        and station_id not in DEMO_ANOMALY_STATIONS

    ):

        ml_prediction = 0

        ml_status = "Normal"

        anomaly_score = 0.0


    # =====================================
    # CURRENT TIMESTAMP
    # =====================================

    current_timestamp = datetime.now()


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
    # DEMO CONTROL
    #
    # Healthy stations should remain
    # healthy during demonstration.
    # =====================================

    if (

        DEMO_MODE

        and station_id not in DEMO_ANOMALY_STATIONS

    ):

        m3_results = []


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

        history_df.tail(3).to_string(

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

    for result in m3_results:

        if result.timestamp is None:

            continue


        result_timestamp = pd.to_datetime(

            result.timestamp
        )


        current_timestamp_pd = pd.to_datetime(

            current_timestamp
        )


        timestamp_match = (

            abs(

                (

                    result_timestamp

                    - current_timestamp_pd

                ).total_seconds()

            ) < 0.001
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
    # use latest M3 anomaly result.
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

                    dict.fromkeys(

                        rule_anomaly_types
                    )
                )

                if rule_anomaly_types

                else "NORMAL"
            ),


        "rule_feature":

            (

                ", ".join(

                    dict.fromkeys(

                        str(feature)

                        for feature
                        in rule_features
                    )
                )

                if rule_features

                else None
            ),


        "rule_reason":

            (

                " | ".join(

                    dict.fromkeys(

                        rule_reasons
                    )
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

                        dict.fromkeys(

                            rule_anomaly_types
                        )
                    )

                    if rule_anomaly_types

                    else "NORMAL"
                ),


            "feature":

                (

                    ", ".join(

                        dict.fromkeys(

                            str(feature)

                            for feature
                            in rule_features
                        )
                    )

                    if rule_features

                    else None
                ),


            "reason":

                (

                    " | ".join(

                        dict.fromkeys(

                            rule_reasons
                        )
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
            # IMPORTANT:
            # Get state safely
            # =================================

            state = get_station_state(

                station_id
            )


            history = state[

                "weather_history"
            ]


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
            # ORIGINAL LIVE WEATHER
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
            # CONTROLLED DEMO MODE
            # =================================

            if (

                DEMO_MODE

                and station_id in DEMO_ANOMALIES

            ):

                modifications = (

                    DEMO_ANOMALIES[
                        station_id
                    ]
                )


                # =================================
                # AWS_003
                # SPIKE
                #
                # First 3 readings are normal.
                # 4th reading becomes 120.
                # After that it returns to real API.
                # =================================

                if station_id == "AWS_003":

                    if len(history) == 3:

                        if "wind_speed" in modifications:

                            weather_values[
                                "wind_speed"
                            ] = modifications[
                                "wind_speed"
                            ]


                            print(

                                "[DEMO] AWS_003 "
                                "SPIKE injected: "
                                f"wind_speed="
                                f"{modifications['wind_speed']}"
                            )


                # =================================
                # AWS_005
                # FROZEN VALUE
                #
                # Temperature always remains 30.
                # After enough readings M3 detects
                # FROZEN_VALUE.
                # =================================

                elif station_id == "AWS_005":

                    if "temperature" in modifications:

                        weather_values[
                            "temperature"
                        ] = modifications[
                            "temperature"
                        ]


                        print(

                            "[DEMO] AWS_005 "
                            "FROZEN VALUE: "
                            f"temperature="
                            f"{modifications['temperature']}"
                        )


            # =================================
            # PRINT FINAL DATA
            # =================================

            print(

                f"[DEMO] Final weather data "
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
                    ]
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
            "demo",

        "total_stations":
            len(STATIONS),

        "stations":
            results,

        "timestamp":
            str(datetime.now())
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


            "latest_result":

                latest_result
        }


    return {

        "backend_status":
            "online",

        "mode":
            "demo",

        "model_status":
            "loaded",

        "total_stations":
            len(STATIONS),

        "active_station_states":
            len(station_states),

        "stations":
            station_status
    }