"""
What-If Scenario Simulation Engine
----------------------------------
Feature Addressed:
- Feature 7: What-If Simulation

Allows municipal planners and emergency commanders to simulate synthetic shocks:
1. "What if rainfall intensifies by +50 mm/hr?"
2. "What if high-capacity pump capacity fails in South Zone?"
3. "What if a key flyover is cordoned off?"
"""

from typing import Dict, Any, List
import pandas as pd


class WhatIfSimulationEngine:
    """
    Simulates counterfactual stress tests and evaluates urban resilience.
    """

    def __init__(self):
        pass

    def simulate_rainfall_surge(self, df: pd.DataFrame, additional_rain_mm: float) -> Dict[str, Any]:
        """
        Simulate impact of an unexpected extreme precipitation surge.
        
        Args:
            df (pd.DataFrame): Current urban incidents dataset
            additional_rain_mm (float): Rain surge amount in millimeters
            
        Returns:
            Dict: Comparative baseline vs simulated metrics
        """
        baseline_floods = len(df[df["incident_type"] == "Flooding / Waterlogging"])
        simulated_new_at_risk = int(len(df) * (additional_rain_mm / 150.0))
        
        return {
            "additional_rain_mm": additional_rain_mm,
            "baseline_flooding_incidents": baseline_floods,
            "projected_additional_flood_zones": simulated_new_at_risk,
            "simulated_cascading_risk_multiplier": round(1.0 + (additional_rain_mm / 80.0), 2)
        }

    def simulate_power_grid_outage(self, df: pd.DataFrame, target_zone: str) -> Dict[str, Any]:
        """
        Simulate consequences of a localized blackout on traffic signals and water pumps.
        """
        zone_incidents = df[df["zone"] == target_zone] if "zone" in df.columns else df
        affected_signals = len(zone_incidents[zone_incidents["incident_type"] == "Traffic Signal Failure"])
        
        return {
            "target_zone": target_zone,
            "current_zone_incidents": len(zone_incidents),
            "projected_secondary_traffic_gridlocks": affected_signals + 3,
            "estimated_emergency_generator_demand_units": max(len(zone_incidents) // 2, 2)
        }
