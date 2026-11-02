"""
Configuration Module for CivicOS - Person 3
---------------------------------------------
Predictive Intelligence & Urban Risk Engine

Contains centralized configuration parameters, file paths, 
and risk threshold definitions used across all engine modules.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "urban_incidents.csv"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Geospatial Parameters (Bangalore / Metro Urban Grid)
DEFAULT_CITY_CENTER = {"lat": 12.9716, "lon": 77.5946}
CITY_BOUNDS = {
    "min_lat": 12.85,
    "max_lat": 13.15,
    "min_lon": 77.45,
    "max_lon": 77.78,
}

# Risk Threshold Constants
HIGH_SEVERITY_THRESHOLD = 7.0
CRITICAL_PRIORITY_THRESHOLD = 80.0
HEAVY_RAINFALL_THRESHOLD_MM = 50.0
HIGH_WIND_THRESHOLD_KMH = 40.0

# Supported Incident Types
INCIDENT_TYPES = [
    "Flooding / Waterlogging",
    "Water Main Break",
    "Power Outage",
    "Traffic Signal Failure",
    "Tree Fall",
    "Pothole / Road Damage",
    "Sewer Overflow",
    "Gas Leak Report",
    "Fire Hazard",
    "Flyover / Bridge Defect",
]

# Supported Urban Zones
URBAN_ZONES = [
    "Central Zone",
    "East Zone",
    "South Zone",
    "West Zone",
    "North Zone",
]
