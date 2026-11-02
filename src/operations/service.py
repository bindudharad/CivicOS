"""SQLite persistence and deterministic intake workflow.

This module deliberately persists only operator-created records.  The bundled CSV
remains a documented synthetic analytical reference dataset, not a second database.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from src.location_intelligence.location_engine import LocationIntelligenceEngine


class OperationsService:
    """Small canonical store for incident, assignment, and resolution lifecycle data."""

    def __init__(self, database_path: Path):
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.database_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize(self) -> None:
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    status TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
                    incident_type TEXT NOT NULL, category TEXT NOT NULL, department TEXT NOT NULL,
                    ward TEXT, zone TEXT, latitude REAL NOT NULL, longitude REAL NOT NULL,
                    severity_score REAL NOT NULL, affected_population INTEGER NOT NULL,
                    duplicate_of TEXT, analysis_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS work_orders (
                    id TEXT PRIMARY KEY, incident_id TEXT NOT NULL, created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL, status TEXT NOT NULL, department TEXT NOT NULL,
                    assignee TEXT, instructions TEXT NOT NULL, resolution_evidence TEXT,
                    FOREIGN KEY(incident_id) REFERENCES incidents(id)
                );
            """)

    @staticmethod
    def classify(description: str, category: Optional[str]) -> Dict[str, str]:
        text = description.casefold()
        rules = [
            (("drain", "waterlog", "flood", "rain"), "Flooding / Waterlogging", "Environmental", "Drainage & Stormwater"),
            (("pothole", "road", "bridge"), "Pothole / Road Damage", "Infrastructure", "Roads & Transport"),
            (("power", "electric", "transformer"), "Power Outage", "Utilities", "Electricity"),
            (("tree", "branch"), "Tree Fall", "Infrastructure", "Parks & Urban Forestry"),
            (("pipe", "water main", "leak"), "Water Main Break", "Utilities", "Water Supply"),
        ]
        for terms, incident_type, detected_category, department in rules:
            if any(term in text for term in terms):
                return {"incident_type": incident_type, "category": category or detected_category, "department": department}
        return {"incident_type": "Municipal Service Issue", "category": category or "General", "department": "Municipal Control Room"}

    @staticmethod
    def _token_similarity(first: str, second: str) -> float:
        a, b = set(first.casefold().split()), set(second.casefold().split())
        return len(a & b) / max(len(a | b), 1)

    def _find_duplicate(self, description: str, incident_type: str, latitude: float, longitude: float) -> Optional[str]:
        with self._connect() as conn:
            candidates = conn.execute("SELECT id, description, latitude, longitude FROM incidents WHERE incident_type = ? AND status != 'resolved'", (incident_type,)).fetchall()
        for candidate in candidates:
            distance = LocationIntelligenceEngine.haversine_distance(latitude, longitude, candidate["latitude"], candidate["longitude"])
            if distance <= 0.35 and self._token_similarity(description, candidate["description"]) >= 0.25:
                return candidate["id"]
        return None

    def create_incident(self, payload: Dict[str, Any], analysis: Callable[[Dict[str, Any]], Dict[str, Any]]) -> Dict[str, Any]:
        classification = self.classify(payload["description"], payload.get("category"))
        enriched = {**payload, **classification}
        duplicate_of = self._find_duplicate(enriched["description"], classification["incident_type"], enriched["latitude"], enriched["longitude"])
        result = analysis(enriched)
        incident_id, now = f"CIV-{uuid.uuid4().hex[:8].upper()}", self._now()
        status = "triaged" if not duplicate_of else "grouped_duplicate"
        with self._connect() as conn:
            conn.execute("""INSERT INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", (
                incident_id, now, now, status, enriched["title"], enriched["description"], classification["incident_type"], classification["category"], classification["department"],
                enriched.get("ward"), enriched.get("zone"), enriched["latitude"], enriched["longitude"], enriched["severity_score"], enriched["affected_population"], duplicate_of, json.dumps(result),
            ))
        record = self.get_incident(incident_id)
        if not duplicate_of:
            record["work_order"] = self.create_work_order(incident_id, classification["department"], result["recommendation"]["recommended_actions"][0])
        return record

    def create_work_order(self, incident_id: str, department: str, instructions: str) -> Dict[str, Any]:
        work_order_id, now = f"WO-{uuid.uuid4().hex[:8].upper()}", self._now()
        with self._connect() as conn:
            conn.execute("INSERT INTO work_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (work_order_id, incident_id, now, now, "open", department, None, instructions, None))
        return self.get_work_order(work_order_id)

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        return self._incident_row(row) if row else None

    def list_incidents(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM incidents ORDER BY created_at DESC").fetchall()
        return [self._incident_row(row) for row in rows]

    @staticmethod
    def _incident_row(row: sqlite3.Row) -> Dict[str, Any]:
        data = dict(row)
        data["analysis"] = json.loads(data.pop("analysis_json"))
        return data

    def get_work_order(self, work_order_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM work_orders WHERE id = ?", (work_order_id,)).fetchone()
        return dict(row) if row else None

    def list_work_orders(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM work_orders ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]

    def assign_work_order(self, work_order_id: str, assignee: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            cursor = conn.execute("UPDATE work_orders SET assignee = ?, status = 'assigned', updated_at = ? WHERE id = ?", (assignee, self._now(), work_order_id))
        return self.get_work_order(work_order_id) if cursor.rowcount else None

    def resolve_work_order(self, work_order_id: str, evidence: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            order = conn.execute("SELECT incident_id FROM work_orders WHERE id = ?", (work_order_id,)).fetchone()
            if not order:
                return None
            now = self._now()
            conn.execute("UPDATE work_orders SET status = 'resolved', resolution_evidence = ?, updated_at = ? WHERE id = ?", (evidence, now, work_order_id))
            conn.execute("UPDATE incidents SET status = 'resolved', updated_at = ? WHERE id = ?", (now, order["incident_id"]))
        return self.get_work_order(work_order_id)
