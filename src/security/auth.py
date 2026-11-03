"""Dependency-free scrypt authentication for CivicOS's canonical SQLite store."""
from __future__ import annotations
import base64
import hashlib
import hmac
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from fastapi import Depends, Header, HTTPException, status

ROLES = {"administrator", "municipal_officer", "department_operator", "viewer"}
_LOGIN_ATTEMPTS: dict[str, list[datetime]] = {}

def _now() -> datetime: return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$" + base64.b64encode(salt + digest).decode("ascii")

def verify_password(password: str, encoded: str) -> bool:
    try:
        raw = base64.b64decode(encoded.split("$", 1)[1]); salt, expected = raw[:16], raw[16:]
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
        return hmac.compare_digest(actual, expected)
    except (ValueError, IndexError): return False

class AuthService:
    def __init__(self, database_path): self.database_path = database_path
    def _connect(self):
        conn = sqlite3.connect(self.database_path); conn.row_factory = sqlite3.Row; conn.execute("PRAGMA foreign_keys = ON"); return conn
    def create_user(self, username: str, password: str, role: str) -> None:
        if role not in ROLES or len(username) < 3 or len(password) < 12: raise ValueError("Username, password, or role is invalid.")
        with self._connect() as conn:
            conn.execute("INSERT INTO users (username, password_hash, role, created_at, disabled) VALUES (?, ?, ?, ?, 0)", (username.casefold(), hash_password(password), role, _now().isoformat()))
    def update_password(self, username: str, new_password: str) -> None:
        if len(new_password) < 12: raise ValueError("Password must be at least 12 characters.")
        with self._connect() as conn:
            user = conn.execute("SELECT id FROM users WHERE username = ?", (username.casefold(),)).fetchone()
            if not user: raise ValueError(f"User '{username}' does not exist.")
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user["id"]))
            conn.execute("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL", (_now().isoformat(), user["id"]))
            conn.execute("INSERT INTO lifecycle_history (entity_type, entity_id, event_type, created_at, details_json) VALUES (?, ?, ?, ?, ?)", ("security", str(user["id"]), "password_rotated", _now().isoformat(), "{}"))
    def login(self, username: str, password: str, client_key: str = "local") -> Optional[dict]:
        # Scope throttling to a client/user pair so unrelated legitimate users are not locked out.
        attempt_key = f"{client_key}:{username.casefold()}"
        attempts = [item for item in _LOGIN_ATTEMPTS.get(attempt_key, []) if item > _now() - timedelta(minutes=15)]
        if len(attempts) >= 5: raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
        with self._connect() as conn: user = conn.execute("SELECT * FROM users WHERE username = ? AND disabled = 0", (username.casefold(),)).fetchone()
        if not user or not verify_password(password, user["password_hash"]):
            _LOGIN_ATTEMPTS[attempt_key] = attempts + [_now()]; return None
        _LOGIN_ATTEMPTS.pop(attempt_key, None); token = secrets.token_urlsafe(32); expires = _now() + timedelta(minutes=480)
        with self._connect() as conn:
            conn.execute("INSERT INTO sessions (token_hash, user_id, expires_at, created_at, revoked_at) VALUES (?, ?, ?, ?, NULL)", (hashlib.sha256(token.encode()).hexdigest(), user["id"], expires.isoformat(), _now().isoformat()))
            conn.execute("INSERT INTO lifecycle_history (entity_type, entity_id, event_type, created_at, details_json) VALUES (?, ?, ?, ?, ?)", ("security", str(user["id"]), "login", _now().isoformat(), "{}"))
        return {"access_token": token, "expires_at": expires.isoformat(), "role": user["role"], "username": user["username"]}
    def current_user(self, token: str) -> dict:
        with self._connect() as conn:
            row = conn.execute("SELECT users.id, users.username, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > ? AND users.disabled = 0", (hashlib.sha256(token.encode()).hexdigest(), _now().isoformat())).fetchone()
        if not row: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid session required.")
        return dict(row)
    def logout(self, token: str) -> None:
        with self._connect() as conn: conn.execute("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?", (_now().isoformat(), hashlib.sha256(token.encode()).hexdigest()))

def token_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(status_code=401, detail="Bearer authentication required.")
    return authorization.removeprefix("Bearer ")

def require_roles(service: AuthService, allowed: Iterable[str]):
    def dependency(token: str = Depends(token_from_header)):
        user = service.current_user(token)
        if user["role"] not in set(allowed): raise HTTPException(status_code=403, detail="Your role is not authorized for this action.")
        return user
    return dependency
