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
            ],
            "Pothole / Road Damage": [
                "Deploy cold-mix rapid asphalt patching squad to carriageway",
                "Erect reflective chevron warning drums around road crater",
                "Schedule overnight heavy resurfacing for affected lane"
            ],
            "Sewer Overflow": [
                "Dispatch high-pressure jetting and vacuum suction tankers",
                "Apply environmental disinfectant and lime powder to road surface",
                "Inspect downstream manholes for solid-waste blockages"
            ],
            "Gas Leak Report": [
                "Establish 300-meter ignition-free containment cordon immediately",
                "Remotely actuate sector distribution valve shut-off",
                "Deploy hazardous materials vapor dispersion monitors and mist curtains"
            ],
            "Fire Hazard": [
                "Dispatch multi-tender fire suppression units and aerial ladder",
                "Isolate adjacent gas and electric utilities in affected zone",
                "Evacuate downwind buildings and set structural cooling nozzles"
            ],
            "Flyover / Bridge Defect": [
                "Implement immediate heavy-vehicle weight restriction and lane closures",
                "Deploy structural engineering inspection team with ultrasound sensors",
                "Install temporary hydraulic shore jacks under vulnerable girder spans"
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
