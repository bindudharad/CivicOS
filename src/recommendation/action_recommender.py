"""
Preventive Action Recommendation Engine
---------------------------------------
Feature Addressed:
- Feature 8: Preventive Action Recommendation

Generates actionable, department-specific mitigation playbooks for urban incidents,
matching incident type, severity, weather, and cascading risks to optimal interventions.
"""

from typing import Dict, List, Any


class ActionRecommendationEngine:
    """
    Recommends automated operational responses and mitigation strategies.
    """

    def __init__(self):
        # Operational response catalog
        self.playbooks = {
            "Flooding / Waterlogging": [
                "Mobilize portable dewatering pumps to low-lying underpasses",
                "Deploy storm drain desilting team",
                "Issue civic advisories and detour commercial transit"
            ],
            "Water Main Break": [
                "Remotely isolate distribution sector valve",
                "Dispatch rapid pipe-welding crew with replacement sleeves",
                "Station potable drinking water tankers in affected ward"
            ],
            "Power Outage": [
                "Switch feeder lines to auxiliary substation circuit",
                "Deploy mobile diesel generators to hospitals and water pumping stations",
                "Dispatch overhead line repair teams"
            ],
            "Traffic Signal Failure": [
                "Deploy manual traffic enforcement officers immediately",
                "Dispatch signal technicians to check UPS battery backup",
                "Coordinate signal timing changes on adjacent corridors"
            ],
            "Tree Fall": [
                "Dispatch tree cutting team equipped with chainsaws and hydraulic crane",
                "Isolate downed power/telecom wires before cutting",
                "Clear arterial lanes for ambulance and bus access"
            ]
        }

    def get_recommendation(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate proactive action plan based on incident attributes.
        """
        itype = incident.get("incident_type", "Flooding / Waterlogging")
        severity = float(incident.get("severity_score", 5.0))
        actions = self.playbooks.get(itype, ["Deploy municipal assessment squad", "Establish safety perimeter"])
        
        urgency = "URGENT - Immediate Dispatch (< 15 mins)" if severity >= 7.5 else "Standard Priority (< 60 mins)"
        
        return {
            "incident_type": itype,
            "recommended_actions": actions,
            "dispatch_urgency": urgency,
            "suggested_crew": "Emergency Rapid Action Unit" if severity >= 7.5 else "Zonal Maintenance Team"
        }
