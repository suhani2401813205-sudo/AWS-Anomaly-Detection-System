"""
M4 - Station and Feature Health

Health is maintained separately
for every AWS station.
"""

from typing import Optional


# Weather features
FEATURES = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "rainfall",
]


# Health penalty for different sensor/rule problems
HEALTH_PENALTY = {

    "TIMESTAMP_GAP": 3,

    "SPIKE": 5,

    "DRIFT": 6,

    "FROZEN_VALUE": 8,

    "MISSING_DATA": 8,
}


# Small recovery when readings are normal
HEALTH_RECOVERY = 0.5


def update_health(
    previous_health: float,
    ml_anomaly: bool,
    rule_anomaly: bool,
    rule_anomaly_type: Optional[str]
):
    """
    Update station/sensor health.

    Normal readings recover health slowly.

    ML anomaly causes a small health reduction
    because the reading is unusual.

    Rule-based anomalies cause larger penalties
    because they indicate possible sensor/data problems.

    Health is always between 0 and 100.
    """

    penalty = 0

    # ---------------------------------
    # RULE ANOMALY
    # ---------------------------------

    if rule_anomaly and rule_anomaly_type:

        rules = [
            rule.strip().upper()
            for rule in str(rule_anomaly_type).split(",")
            if rule.strip()
            and rule.strip().upper() != "NORMAL"
        ]

        penalties = [
            HEALTH_PENALTY.get(rule, 4)
            for rule in rules
        ]

        if penalties:
            # Use strongest rule penalty
            penalty += max(penalties)


    # ---------------------------------
    # ML ANOMALY
    # ---------------------------------

    ML_ANOMALY_PENALTY = 2

    if ml_anomaly and penalty == 0:
        penalty = ML_ANOMALY_PENALTY


    # ---------------------------------
    # HEALTH UPDATE
    # ---------------------------------

    if penalty == 0:

        # Normal reading → gradual recovery

        new_health = (
            previous_health
            + HEALTH_RECOVERY
        )

    else:

        # Anomaly → reduce health

        new_health = (
            previous_health
            - penalty
        )


    # ---------------------------------
    # KEEP HEALTH BETWEEN 0 AND 100
    # ---------------------------------

    return round(
        max(
            0,
            min(
                100,
                new_health
            )
        ),
        2
    )