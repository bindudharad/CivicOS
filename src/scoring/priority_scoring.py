"""
Impact, Severity & Smart Priority Engine
----------------------------------------
Features Addressed:
- Feature 5: Impact and Severity Scoring
- Feature 6: Smart Priority Engine
- Feature 9: Prevention Impact Score

Computes multi-criteria composite scores combining:
- Severity of damage
- Population exposure
- Cascading multiplier
- Weather severity factor
- Potential risk reduction via proactive prevention
"""

from typing import Dict, Any


class PriorityScoringEngine:
    """
    Computes real-time dynamic priority rankings and prevention effectiveness scores.
    """

    def __init__(self):
        pass

    def compute_composite_severity(self, incident: Dict[str, Any]) -> float:
        """
        Feature 5: Calculate composite impact and severity score (1.0 to 10.0).
        """
        raw_severity = float(incident.get("severity_score", 5.0))
        impact_radius = float(incident.get("impact_radius_meters", 100))
        
        # Scale impact radius contribution (0 to 1.5)
        radius_factor = min(impact_radius / 1500.0, 1.5)
        composite = min(raw_severity * 0.85 + radius_factor, 10.0)
        return round(composite, 2)

    def compute_smart_priority(self, incident: Dict[str, Any]) -> float:
        """
        Feature 6: Compute smart dispatch priority score (1 to 100).
        """
        severity = float(incident.get("severity_score", 5.0))
        affected_pop = float(incident.get("affected_population", 1000))
        cascading = 1.35 if int(incident.get("cascading_risk_flag", 0)) == 1 else 1.0
        
        # Population factor: up to 25 points
        pop_points = min((affected_pop / 15000.0) * 25.0, 25.0)
        
        # Base severity points: up to 55 points
        severity_points = (severity / 10.0) * 55.0
        
        total = (severity_points + pop_points) * cascading
        return min(round(total, 1), 100.0)

    def compute_prevention_impact(self, incident: Dict[str, Any]) -> float:
        """
        Feature 9: Compute risk mitigation score if early prevention is applied.
        """
        priority = self.compute_smart_priority(incident)
        # Preventive action delivers highest return on high cascading incidents
        multiplier = 0.90 if int(incident.get("cascading_risk_flag", 0)) == 1 else 0.75
        prevention_score = min(round(priority * multiplier, 1), 99.0)
        return prevention_score
