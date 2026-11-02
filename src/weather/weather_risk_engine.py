"""
Weather-Based Risk Analysis Engine
----------------------------------
Feature Addressed:
- Feature 10: Weather-Based Risk Analysis

Analyzes live or forecasted meteorological data (rainfall intensity, wind gusts, heat index)
and computes correlated urban risk multipliers across infrastructure assets.
"""

from typing import Dict, Any


class WeatherRiskEngine:
    """
    Evaluates weather hazards and their amplifying effects on municipal infrastructure.
    """

    def __init__(self):
        pass

    def evaluate_weather_risk(
        self,
        rainfall_mm: float,
        wind_speed_kmh: float,
        temperature_c: float
    ) -> Dict[str, Any]:
        """
        Assess municipal hazard alert level based on weather triggers.
        
        Args:
            rainfall_mm (float): Measured or forecasted rain in mm
            wind_speed_kmh (float): Wind velocity in km/h
            temperature_c (float): Temperature in Celsius
            
        Returns:
            Dict: Risk levels, alerts, and multipliers
        """
        alerts = []
        multiplier = 1.0
        
        # Rainfall analysis
        if rainfall_mm >= 70.0:
            alerts.append("CRITICAL: Severe precipitation alert - flash flood risk")
            multiplier += 0.6
        elif rainfall_mm >= 30.0:
            alerts.append("WARNING: Moderate rainfall - waterlogging likely in low-lying zones")
            multiplier += 0.3
            
        # Wind speed analysis
        if wind_speed_kmh >= 50.0:
            alerts.append("CRITICAL: High wind alert - high danger of uprooted trees & snapped lines")
            multiplier += 0.4
        elif wind_speed_kmh >= 30.0:
            alerts.append("ADVISORY: Breezy/gusty winds - secure loose structures")
            multiplier += 0.15
            
        # Extreme heat analysis
        if temperature_c >= 39.0:
            alerts.append("WARNING: Heatwave alert - increased electrical transformer load & fire hazard")
            multiplier += 0.25

        # Determine overall threat level
        if multiplier >= 1.7:
            threat_level = "RED ALERT"
        elif multiplier >= 1.3:
            threat_level = "AMBER WARNING"
        else:
            threat_level = "GREEN / NORMAL"

        return {
            "threat_level": threat_level,
            "risk_multiplier": round(multiplier, 2),
            "active_alerts": alerts if alerts else ["Normal weather conditions prevailing"],
            "parameters": {
                "rainfall_mm": rainfall_mm,
                "wind_speed_kmh": wind_speed_kmh,
                "temperature_c": temperature_c
            }
        }
