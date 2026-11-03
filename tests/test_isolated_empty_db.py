"""
Genuine Isolated Empty Database Test for CivicOS V3.1.2
Tests that an actual clean SQLite database with zero records:
1. Initializes all required tables without error.
2. Returns exactly 0 records for incidents and work orders.
3. Successfully serves REST API endpoints returning confirmed zero counts.
4. Leaves the normal project database completely untouched.
5. Cleans up all temporary database files upon completion.
6. Generates unique dynamic credentials using secrets (zero hardcoded passwords).
"""
import pytest
import secrets
import sqlite3
from pathlib import Path
from fastapi.testclient import TestClient

from src.config import OPERATIONS_DB_PATH
from src.operations.service import OperationsService
from src.security.auth import AuthService
import main


def test_isolated_empty_sqlite_database(tmp_path):
    """Verify true zero-state behavior using an isolated temporary SQLite database."""
    # 1. Snapshot normal project database (SHA-256 with WAL and SHM accounting)
    import hashlib

    def get_sqlite_sha256_state(db_file: Path) -> dict:
        state = {}
        if db_file.exists():
            state["db"] = hashlib.sha256(db_file.read_bytes()).hexdigest()
        wal_file = Path(f"{db_file}-wal")
        if wal_file.exists():
            state["wal"] = hashlib.sha256(wal_file.read_bytes()).hexdigest()
        shm_file = Path(f"{db_file}-shm")
        if shm_file.exists():
            state["shm"] = hashlib.sha256(shm_file.read_bytes()).hexdigest()
        return state

    prod_db = Path(OPERATIONS_DB_PATH)
    assert prod_db.exists(), "Canonical project database must exist"
    prod_state_before = get_sqlite_sha256_state(prod_db)

    # 2. Create isolated temporary database path
    temp_db_path = tmp_path / "isolated_empty_civicos.sqlite3"
    assert not temp_db_path.exists()

    # 3. Initialize schema on isolated database
    test_ops = OperationsService(temp_db_path)
    test_auth = AuthService(temp_db_path)
    assert temp_db_path.exists(), "Isolated database file must be created"

    # 4. Verify tables exist in isolated database
    with sqlite3.connect(temp_db_path) as conn:
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        assert "incidents" in tables, "Table 'incidents' must exist"
        assert "work_orders" in tables, "Table 'work_orders' must exist"
        assert "users" in tables, "Table 'users' must exist"
        assert "sessions" in tables, "Table 'sessions' must exist"

    # 5. Verify direct zero counts on clean database
    incidents_list = test_ops.list_incidents()
    work_orders_list = test_ops.list_work_orders()
    assert len(incidents_list) == 0, f"Clean database must have 0 incidents, found {len(incidents_list)}"
    assert len(work_orders_list) == 0, f"Clean database must have 0 work orders, found {len(work_orders_list)}"

    # 6. Provision an isolated temporary admin user with cryptographically generated credentials
    temp_admin_user = f"iso_admin_{secrets.token_hex(4)}"
    temp_admin_pass = secrets.token_urlsafe(24) + "Aa1!"
    test_auth.create_user(temp_admin_user, temp_admin_pass, "administrator")
    login_res = test_auth.login(temp_admin_user, temp_admin_pass)
    assert login_res is not None, "Login on isolated database must succeed"
    token = login_res["access_token"]

    # 7. Test API endpoints against isolated operations service
    orig_ops_path = main.operations_service.database_path
    orig_auth_path = main.auth_service.database_path
    try:
        main.operations_service.database_path = temp_db_path
        main.auth_service.database_path = temp_db_path
        client = TestClient(main.app)

        # GET /api/incidents with bearer token
        inc_res = client.get("/api/incidents", headers={"Authorization": f"Bearer {token}"})
        assert inc_res.status_code == 200, f"Expected 200, got {inc_res.status_code}"
        assert inc_res.json()["data"] == [], "Incidents data array must be empty"
        assert inc_res.json()["meta"]["count"] == 0, "Incidents count must be 0"

        # GET /api/work-orders with bearer token
        wo_res = client.get("/api/work-orders", headers={"Authorization": f"Bearer {token}"})
        assert wo_res.status_code == 200, f"Expected 200, got {wo_res.status_code}"
        assert wo_res.json()["data"] == [], "Work orders data array must be empty"
        assert wo_res.json()["meta"]["count"] == 0, "Work orders count must be 0"

    finally:
        main.operations_service.database_path = orig_ops_path
        main.auth_service.database_path = orig_auth_path

    # 8. Verify the normal project database was untouched via SHA-256 hash comparison
    prod_state_after = get_sqlite_sha256_state(prod_db)
    assert prod_state_before == prod_state_after, (
        f"Production database SHA-256 state changed: before={prod_state_before}, after={prod_state_after}"
    )

    # 9. Clean up temporary database handles
    import gc
    del client
    gc.collect()
    try:
        if temp_db_path.exists():
            temp_db_path.unlink()
    except PermissionError:
        # On Windows, pytest tmp_path automatically cleans up the folder when released
        pass
