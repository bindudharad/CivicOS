"""Regression coverage for the recorded Plotly/Pandas map crash."""
import pandas as pd
from src.geospatial.spatial_intelligence import SpatialIntelligenceEngine

def test_map_sorts_descending_and_ignores_invalid_locations():
    data = pd.DataFrame([
        {"incident_id":"low", "latitude":12.9,"longitude":77.5,"severity_score":2,"category":"Environmental","impact_radius_meters":100,"affected_population":1},
        {"incident_id":"high", "latitude":12.91,"longitude":77.51,"severity_score":9,"category":"Environmental","impact_radius_meters":100,"affected_population":1},
        {"incident_id":"bad", "latitude":None,"longitude":77.5,"severity_score":10,"category":"Environmental","impact_radius_meters":100,"affected_population":1},
    ])
    figure = SpatialIntelligenceEngine().generate_plotly_map(data, enable_hotspots=False)
    assert len(figure.data) >= 2
    # The buffer trace is ordered by severity so highest-severity impact boundaries render first.
    assert abs(figure.data[0].lat[0] - 12.91) < 0.001

def test_map_handles_empty_and_missing_severity():
    engine = SpatialIntelligenceEngine()
    assert engine.generate_plotly_map(pd.DataFrame()).layout.title.text.startswith("No valid")
    data = pd.DataFrame([{ "incident_id":"one", "latitude":12.9,"longitude":77.5,"category":"Environmental","impact_radius_meters":100,"affected_population":1 }])
    assert len(engine.generate_plotly_map(data, enable_hotspots=False).data) > 0
