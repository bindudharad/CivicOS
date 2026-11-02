"""Phase 5 persistence, duplicate, transition, and failure-recovery regression tests."""
from pathlib import Path
import sqlite3

from src.operations.service import OperationsService


def _analysis(incident):
    return {"recommendation": {"recommended_actions": ["Inspect and clear the identified drain"]}, "classification": {"department": incident["department"]}}


def _payload(description="Blocked drain causes waterlogging", lat=12.9716, lon=77.5946):
    return {"title": "Drainage incident", "description": description, "latitude": lat, "longitude": lon, "ward": "Ward 1", "zone": "Central Zone", "severity_score": 8.0, "affected_population": 500}


def test_persistence_restart_lifecycle_and_history(tmp_path: Path):
    database = tmp_path / "operations.sqlite3"
    first = OperationsService(database)
    incident = first.create_incident(_payload(), _analysis)
    work_order = incident["work_order"]
    assert first.assign_work_order(work_order["id"], "Drainage Team")
    assert first.start_work_order(work_order["id"])
    assert first.resolve_work_order(work_order["id"], "Supervisor inspection reference: EVT-42")

    restarted = OperationsService(database)
    persisted = restarted.get_incident(incident["id"])
    assert persisted["status"] == "resolved"
    assert [event["event_type"] for event in persisted["history"]] == ["created", "resolved"]
    order = restarted.get_work_order(work_order["id"])
    assert order["status"] == "resolved"
    assert order["resolution_evidence"] == "Supervisor inspection reference: EVT-42"


def test_duplicate_matrix_is_conservative(tmp_path: Path):
    service = OperationsService(tmp_path / "duplicates.sqlite3")
    first = service.create_incident(_payload(), _analysis)
    identical = service.create_incident(_payload(), _analysis)
    nearby_similar = service.create_incident(_payload("Drain blockage leads to waterlogging", 12.9720, 77.5948), _analysis)
    different_type = service.create_incident(_payload("Power transformer outage", 12.9716, 77.5946), _analysis)
    different_ward_location = service.create_incident(_payload("Blocked drain causes waterlogging", 13.0316, 77.6546), _analysis)
    assert identical["duplicate_of"] == first["id"]
    assert nearby_similar["duplicate_of"] == first["id"]
    assert different_type["duplicate_of"] is None
    assert different_ward_location["duplicate_of"] is None
    assert identical["duplicate_diagnostics"]["thresholds"]["distance_km"] == 0.35


def test_invalid_transitions_and_database_integrity(tmp_path: Path):
    database = tmp_path / "integrity.sqlite3"
    service = OperationsService(database)
    incident = service.create_incident(_payload(), _analysis)
    order_id = incident["work_order"]["id"]
    assert service.start_work_order(order_id) is None
    assert service.resolve_work_order(order_id, "evidence") is None
    assert service.assign_work_order(order_id, "Crew One")
    assert service.resolve_work_order(order_id, "evidence")
    assert service.resolve_work_order(order_id, "duplicate evidence") is None
    with sqlite3.connect(database) as connection:
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
        assert connection.execute("SELECT COUNT(*) FROM work_orders WHERE incident_id NOT IN (SELECT id FROM incidents)").fetchone()[0] == 0
